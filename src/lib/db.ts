/**
 * DB client. Talks HTTP to the self-hosted opens-db-server (see ./db-server/),
 * which wraps the local SQLite dev.db and is exposed to the internet via a
 * Cloudflare Tunnel.
 *
 * Required env vars:
 *   DATABASE_URL  — base URL of the db-server (e.g. https://db.example.com)
 *   DB_TOKEN      — bearer token shared with the db-server
 *
 * Keeps the same dbGet / dbAll / dbRun API as the previous libsql client,
 * so no call sites need to change.
 */

const DATABASE_URL = process.env.DATABASE_URL;
const DB_TOKEN = process.env.DB_TOKEN;

interface QueryResponse<T> {
  rows: T[];
  rowsAffected?: number;
  lastInsertRowid?: number;
  error?: string;
}

async function call<T = Record<string, unknown>>(
  sql: string,
  args: unknown[]
): Promise<QueryResponse<T>> {
  if (!DATABASE_URL) throw new Error("DATABASE_URL env var is required");
  if (!DB_TOKEN) throw new Error("DB_TOKEN env var is required");

  const r = await fetch(`${DATABASE_URL}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, args }),
    // Bound the wait so a stuck tunnel doesn't pin a Netlify function.
    signal: AbortSignal.timeout(15_000),
  });

  let data: QueryResponse<T>;
  try {
    data = (await r.json()) as QueryResponse<T>;
  } catch {
    throw new Error(`db-server ${r.status}: invalid JSON response`);
  }

  if (!r.ok) {
    throw new Error(`db-server ${r.status}: ${data.error ?? "unknown"}`);
  }
  return data;
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T | undefined> {
  const { rows } = await call<T>(sql, args);
  return rows[0];
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  const { rows } = await call<T>(sql, args);
  return rows;
}

export async function dbRun(sql: string, args: unknown[] = []) {
  return call(sql, args);
}
