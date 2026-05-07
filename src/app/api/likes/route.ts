import { NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";

export const dynamic = "force-dynamic";

async function readCount(): Promise<number> {
  const row = await dbGet<{ value: number }>(
    "SELECT value FROM SiteCounter WHERE key = 'likes'"
  );
  return row?.value ?? 0;
}

export async function GET() {
  const count = await readCount();
  return NextResponse.json({ count });
}

export async function POST() {
  await dbRun(
    "INSERT INTO SiteCounter (key, value) VALUES ('likes', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1"
  );
  const count = await readCount();
  return NextResponse.json({ count });
}
