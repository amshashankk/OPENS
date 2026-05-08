// Tiny SQL-over-HTTP API. Exposes ./dev.db (override with DB_PATH env)
// to the Next.js app over the network. Auth via bearer token (DB_TOKEN).
//
// Run:
//   DB_TOKEN=<32+ char secret> [DB_PATH=/path/to/dev.db] [PORT=3001] npm start
//
// Then point the Next.js app's DATABASE_URL at this server's public URL
// (typically a Cloudflare Tunnel mapped to this host:port).

import Fastify from "fastify";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "..", "dev.db");
const TOKEN = process.env.DB_TOKEN;
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "127.0.0.1";

if (!TOKEN || TOKEN.length < 16) {
  console.error("DB_TOKEN env var required (>= 16 chars). Generate one with:");
  console.error("  openssl rand -hex 32");
  process.exit(1);
}

const db = new Database(DB_PATH, { fileMustExist: true });
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  bodyLimit: 1024 * 1024, // 1 MB body cap
});

// Bearer token auth on every request.
app.addHook("onRequest", async (req, reply) => {
  if (req.url === "/health") return; // public health endpoint
  const authz = req.headers.authorization ?? "";
  if (authz !== `Bearer ${TOKEN}`) {
    reply.code(401).send({ error: "unauthorized" });
  }
});

app.get("/health", async () => ({ ok: true }));

// Simple read query — never modifies state.
function isReadOnly(sql) {
  return /^\s*(SELECT|WITH|PRAGMA|EXPLAIN)\b/i.test(sql);
}

app.post("/query", async (req, reply) => {
  const { sql, args } = (req.body ?? {});
  if (typeof sql !== "string" || !sql.trim()) {
    return reply.code(400).send({ error: "sql required (string)" });
  }
  const argList = Array.isArray(args) ? args : [];

  try {
    const stmt = db.prepare(sql);
    if (isReadOnly(sql)) {
      return { rows: stmt.all(...argList) };
    }
    const info = stmt.run(...argList);
    return {
      rows: [],
      rowsAffected: info.changes,
      lastInsertRowid: typeof info.lastInsertRowid === "bigint"
        ? Number(info.lastInsertRowid)
        : info.lastInsertRowid,
    };
  } catch (err) {
    req.log.warn({ err: String(err.message) }, "query failed");
    return reply.code(400).send({ error: String(err.message) });
  }
});

// Batch — array of { sql, args } executed in order in a single transaction.
app.post("/batch", async (req, reply) => {
  const stmts = req.body?.stmts;
  if (!Array.isArray(stmts) || stmts.length === 0) {
    return reply.code(400).send({ error: "stmts required (non-empty array)" });
  }

  try {
    const results = db.transaction((items) => {
      const out = [];
      for (const { sql, args } of items) {
        if (typeof sql !== "string") throw new Error("each stmt needs sql:string");
        const stmt = db.prepare(sql);
        const argList = Array.isArray(args) ? args : [];
        if (isReadOnly(sql)) {
          out.push({ rows: stmt.all(...argList) });
        } else {
          const info = stmt.run(...argList);
          out.push({
            rows: [],
            rowsAffected: info.changes,
            lastInsertRowid: typeof info.lastInsertRowid === "bigint"
              ? Number(info.lastInsertRowid)
              : info.lastInsertRowid,
          });
        }
      }
      return out;
    })(stmts);
    return { results };
  } catch (err) {
    req.log.warn({ err: String(err.message) }, "batch failed");
    return reply.code(400).send({ error: String(err.message) });
  }
});

app.listen({ port: PORT, host: HOST })
  .then(() => {
    app.log.info(`db-server listening on http://${HOST}:${PORT}`);
    app.log.info(`  DB_PATH = ${DB_PATH}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

// Graceful shutdown so the SQLite WAL file is properly closed.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    app.log.info(`got ${sig}, closing`);
    app.close().then(() => {
      try { db.close(); } catch {}
      process.exit(0);
    });
  });
}
