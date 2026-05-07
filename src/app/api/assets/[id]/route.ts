import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { parseTags } from "@/lib/parseTags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await dbRun("UPDATE Asset SET views = views + 1 WHERE id = ?", [id]);
  const asset = await dbGet<Record<string, unknown>>(
    "SELECT * FROM Asset WHERE id = ?",
    [id]
  );

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const similar = await dbAll<Record<string, unknown>>(
    "SELECT * FROM Asset WHERE category = ? AND id != ? ORDER BY downloads DESC LIMIT 8",
    [asset.category, id]
  );

  const tags = parseTags(asset.tags);
  let relatedFromOtherCategories: Record<string, unknown>[] = [];
  if (tags.length > 0) {
    const tagConditions = tags.slice(0, 3).map(() => "tags LIKE ?").join(" OR ");
    const tagParams = tags.slice(0, 3).map((t: string) => `%${t}%`);
    relatedFromOtherCategories = await dbAll<Record<string, unknown>>(
      `SELECT * FROM Asset WHERE category != ? AND id != ? AND (${tagConditions}) ORDER BY downloads DESC LIMIT 12`,
      [asset.category, id, ...tagParams]
    );
  }

  const parse = (a: Record<string, unknown>) => ({ ...a, tags: parseTags(a.tags), featured: Boolean(a.featured), animated: Boolean(a.animated) });

  return NextResponse.json({
    asset: parse(asset),
    similar: similar.map(parse),
    related: relatedFromOtherCategories.map(parse),
  });
}
