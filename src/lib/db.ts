import { createClient, type Client, type InValue } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __libsqlClient: Client | undefined;
}

const url = process.env.DATABASE_URL || "file:dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db: Client =
  globalThis.__libsqlClient ??
  createClient({
    url,
    authToken,
    intMode: "number",
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__libsqlClient = db;
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T | undefined> {
  const r = await db.execute({ sql, args: args as InValue[] });
  return r.rows[0] as T | undefined;
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  const r = await db.execute({ sql, args: args as InValue[] });
  return r.rows as unknown as T[];
}

export async function dbRun(sql: string, args: unknown[] = []) {
  return db.execute({ sql, args: args as InValue[] });
}
