/**
 * Migrate local dev.db → Turso.
 *
 * Reads dev.db (better-sqlite3, sync) and pushes all rows to the libsql DB
 * specified by DATABASE_URL + DATABASE_AUTH_TOKEN.
 *
 * Run: npx tsx scripts/migrate-to-turso.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { createClient, type InValue } from "@libsql/client";
import path from "path";

const DEV_DB_PATH = path.resolve(process.cwd(), "dev.db");
const BATCH_SIZE = 200;

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!url || !url.startsWith("libsql://")) {
    throw new Error("DATABASE_URL must be set to a libsql:// URL");
  }
  if (!authToken) {
    throw new Error("DATABASE_AUTH_TOKEN must be set");
  }

  console.log(`Source: ${DEV_DB_PATH}`);
  console.log(`Target: ${url}`);

  const local = new Database(DEV_DB_PATH, { readonly: true });
  const remote = createClient({ url, authToken, intMode: "number" });

  // 1. Pull schema from local DB (CREATE statements only, exclude sqlite_*).
  const schemaRows = local
    .prepare(
      "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 ELSE 3 END"
    )
    .all() as { sql: string }[];

  console.log(`\n[1/3] Applying schema (${schemaRows.length} statements)...`);
  for (const { sql } of schemaRows) {
    const stmt = sql.trim();
    if (!stmt) continue;
    try {
      await remote.execute(stmt);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("already exists")) continue;
      console.error(`Failed: ${stmt.slice(0, 80)}...`);
      throw err;
    }
  }

  // 2. Get list of user tables.
  const tables = local
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
    )
    .all() as { name: string }[];

  console.log(`\n[2/3] Migrating ${tables.length} tables...`);
  for (const { name } of tables) {
    const totalRow = local.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get() as { c: number };
    const total = totalRow.c;
    if (total === 0) {
      console.log(`  ${name}: empty, skipping`);
      continue;
    }

    const cols = local.prepare(`PRAGMA table_info("${name}")`).all() as { name: string }[];
    const colNames = cols.map((c) => `"${c.name}"`).join(", ");
    const placeholders = cols.map(() => "?").join(", ");
    const insertSql = `INSERT OR REPLACE INTO "${name}" (${colNames}) VALUES (${placeholders})`;

    const select = local.prepare(`SELECT * FROM "${name}"`);
    const iter = select.iterate() as IterableIterator<Record<string, unknown>>;

    let pushed = 0;
    let batch: { sql: string; args: InValue[] }[] = [];

    const flush = async () => {
      if (batch.length === 0) return;
      await remote.batch(batch, "write");
      pushed += batch.length;
      batch = [];
      const pct = ((pushed / total) * 100).toFixed(1);
      process.stdout.write(`\r  ${name}: ${pushed}/${total} (${pct}%)        `);
    };

    for (const row of iter) {
      const args = cols.map((c) => row[c.name] as InValue);
      batch.push({ sql: insertSql, args });
      if (batch.length >= BATCH_SIZE) await flush();
    }
    await flush();
    process.stdout.write("\n");
  }

  // 3. Verify counts.
  console.log(`\n[3/3] Verifying...`);
  for (const { name } of tables) {
    const localCount = (local.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get() as { c: number }).c;
    const remoteRes = await remote.execute(`SELECT COUNT(*) as c FROM "${name}"`);
    const remoteCount = remoteRes.rows[0]?.c as number;
    const ok = localCount === remoteCount ? "✓" : "✗";
    console.log(`  ${ok} ${name}: local=${localCount}, remote=${remoteCount}`);
  }

  local.close();
  remote.close();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
