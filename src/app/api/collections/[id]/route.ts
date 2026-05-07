import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseTags } from "@/lib/parseTags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collection = await dbGet<Record<string, unknown>>(
    "SELECT * FROM Collection WHERE id = ? AND userId = ?",
    [id, user.id]
  );

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bookmarks = await dbAll<Record<string, unknown>>(
    `
    SELECT b.*, a.id as aId, a.title, a.previewUrl, a.category, a.tags, a.license, a.fileFormat, a.downloads, a.animated, a.featured
    FROM Bookmark b JOIN Asset a ON b.assetId = a.id
    WHERE b.collectionId = ?
    ORDER BY b.createdAt DESC
  `,
    [id]
  );

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
          tags: parseTags(b.tags),
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

  await dbRun("DELETE FROM Collection WHERE id = ? AND userId = ?", [id, user.id]);
  return NextResponse.json({ success: true });
}
