/**
 * Drop-in replacement for src/lib/db.ts when the app is talking to
 * opens-db-server (instead of Turso / libsql).
 *
 * Keeps the same dbGet / dbAll / dbRun API so no other file has to change.
 *
 * Set in .env (and on Netlify):
 *   DATABASE_URL=https://db.your-domain.com
 *   DB_TOKEN=<same token as the db-server>
 */

const DATABASE_URL = process.env.DATABASE_URL;
const DB_TOKEN = process.env.DB_TOKEN;

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!DB_TOKEN) throw new Error("DB_TOKEN is required");

interface QueryResponse<T> {
  rows: T[];
  rowsAffected?: number;
  lastInsertRowid?: number;
  error?: string;
}

async function call<T = Record<string, unknown>>(
  path: string,
  body: unknown
): Promise<QueryResponse<T>> {
  const r = await fetch(`${DATABASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // Keep this small — function timeout is the cap anyway.
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await r.json()) as QueryResponse<T>;
  if (!r.ok) {
    throw new Error(`db-server ${r.status}: ${data.error ?? "unknown error"}`);
  }
  return data;
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T | undefined> {
  const { rows } = await call<T>("/query", { sql, args });
  return rows[0];
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  const { rows } = await call<T>("/query", { sql, args });
  return rows;
}

export async function dbRun(sql: string, args: unknown[] = []) {
  return call("/query", { sql, args });
}
