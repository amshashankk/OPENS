import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");

const globalForDb = globalThis as unknown as { db: ReturnType<typeof Database> };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
