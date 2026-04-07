import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collection = db.prepare(
    "SELECT * FROM Collection WHERE id = ? AND userId = ?"
  ).get(id, user.id) as Record<string, unknown> | undefined;

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bookmarks = db.prepare(`
    SELECT b.*, a.id as aId, a.title, a.previewUrl, a.category, a.tags, a.license, a.fileFormat, a.downloads, a.animated, a.featured
    FROM Bookmark b JOIN Asset a ON b.assetId = a.id
    WHERE b.collectionId = ?
    ORDER BY b.createdAt DESC
  `).all(id) as Record<string, unknown>[];

  return NextResponse.json({
    collection: {
      ...collection,
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        asset: {
          id: b.aId,
          title: b.title,
          previewUrl: b.previewUrl,
          category: b.category,
          tags: JSON.parse(b.tags as string),
          license: b.license,
          fileFormat: b.fileFormat,
          downloads: b.downloads,
        },
      })),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  db.prepare("DELETE FROM Collection WHERE id = ? AND userId = ?").run(id, user.id);
  return NextResponse.json({ success: true });
}
