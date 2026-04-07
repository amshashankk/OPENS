import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  db.prepare("UPDATE Asset SET views = views + 1 WHERE id = ?").run(id);
  const asset = db.prepare("SELECT * FROM Asset WHERE id = ?").get(id) as Record<string, unknown> | undefined;

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const similar = db.prepare(
    "SELECT * FROM Asset WHERE category = ? AND id != ? ORDER BY downloads DESC LIMIT 8"
  ).all(asset.category, id) as Record<string, unknown>[];

  return NextResponse.json({
    asset: { ...asset, tags: JSON.parse(asset.tags as string), featured: Boolean(asset.featured), animated: Boolean(asset.animated) },
    similar: similar.map((a) => ({ ...a, tags: JSON.parse(a.tags as string), featured: Boolean(a.featured), animated: Boolean(a.animated) })),
  });
}
