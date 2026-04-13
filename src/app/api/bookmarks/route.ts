import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseTags } from "@/lib/parseTags";
import { randomBytes } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = db.prepare(`
    SELECT b.*, a.id as assetId, a.title, a.previewUrl, a.category, a.tags, a.license, a.fileFormat, a.downloads, a.animated, a.featured
    FROM Bookmark b
    JOIN Asset a ON b.assetId = a.id
    WHERE b.userId = ?
    ORDER BY b.createdAt DESC
  `).all(user.id) as Record<string, unknown>[];

  return NextResponse.json({
    bookmarks: bookmarks.map((b) => ({
      id: b.id,
      assetId: b.assetId,
      collectionId: b.collectionId,
      asset: {
        id: b.assetId,
        title: b.title,
        previewUrl: b.previewUrl,
        category: b.category,
        tags: parseTags(b.tags),
        license: b.license,
        fileFormat: b.fileFormat,
        downloads: b.downloads,
        animated: Boolean(b.animated),
        featured: Boolean(b.featured),
      },
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assetId, collectionId } = await request.json();

  const existing = db.prepare(
    "SELECT id FROM Bookmark WHERE userId = ? AND assetId = ?"
  ).get(user.id, assetId) as { id: string } | undefined;

  if (existing) {
    db.prepare("DELETE FROM Bookmark WHERE id = ?").run(existing.id);
    return NextResponse.json({ bookmarked: false });
  }

  const id = "c" + randomBytes(12).toString("hex");
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO Bookmark (id, userId, assetId, collectionId, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(id, user.id, assetId, collectionId || null, now);

  return NextResponse.json({ bookmarked: true });
}
