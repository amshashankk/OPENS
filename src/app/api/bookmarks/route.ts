import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseTags } from "@/lib/parseTags";
import { randomBytes } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = await dbAll<Record<string, unknown>>(
    `
    SELECT b.*, a.id as assetId, a.title, a.previewUrl, a.category, a.tags, a.license, a.fileFormat, a.downloads, a.animated, a.featured
    FROM Bookmark b
    JOIN Asset a ON b.assetId = a.id
    WHERE b.userId = ?
    ORDER BY b.createdAt DESC
  `,
    [user.id]
  );

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

  const existing = await dbGet<{ id: string }>(
    "SELECT id FROM Bookmark WHERE userId = ? AND assetId = ?",
    [user.id, assetId]
  );

  if (existing) {
    await dbRun("DELETE FROM Bookmark WHERE id = ?", [existing.id]);
    return NextResponse.json({ bookmarked: false });
  }

  const id = "c" + randomBytes(12).toString("hex");
  const now = new Date().toISOString();
  await dbRun(
    "INSERT INTO Bookmark (id, userId, assetId, collectionId, createdAt) VALUES (?, ?, ?, ?, ?)",
    [id, user.id, assetId, collectionId || null, now]
  );

  return NextResponse.json({ bookmarked: true });
}
