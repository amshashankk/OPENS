import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collections = db.prepare(
    "SELECT c.*, (SELECT COUNT(*) FROM Bookmark WHERE collectionId = c.id) as bookmarkCount FROM Collection c WHERE c.userId = ? ORDER BY c.updatedAt DESC"
  ).all(user.id) as Array<Record<string, unknown>>;

  return NextResponse.json({
    collections: collections.map((c) => ({
      ...c,
      _count: { bookmarks: c.bookmarkCount },
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await request.json();
  const id = "c" + randomBytes(12).toString("hex");
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO Collection (id, name, description, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, name, description || null, user.id, now, now);

  return NextResponse.json({ collection: { id, name, description, userId: user.id } });
}
