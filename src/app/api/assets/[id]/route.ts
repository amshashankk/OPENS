import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/parseTags";

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

  // Get related assets from other categories using tags
  const tags = parseTags(asset.tags);
  let relatedFromOtherCategories: Record<string, unknown>[] = [];
  if (tags.length > 0) {
    const tagConditions = tags.slice(0, 3).map(() => "tags LIKE ?").join(" OR ");
    const tagParams = tags.slice(0, 3).map((t: string) => `%${t}%`);
    relatedFromOtherCategories = db.prepare(
      `SELECT * FROM Asset WHERE category != ? AND id != ? AND (${tagConditions}) ORDER BY downloads DESC LIMIT 12`
    ).all(asset.category, id, ...tagParams) as Record<string, unknown>[];
  }

  const parse = (a: Record<string, unknown>) => ({ ...a, tags: parseTags(a.tags), featured: Boolean(a.featured), animated: Boolean(a.animated) });

  return NextResponse.json({
    asset: parse(asset),
    similar: similar.map(parse),
    related: relatedFromOtherCategories.map(parse),
  });
}
