import { NextRequest, NextResponse } from "next/server";
import { dbAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const like = `%${q}%`;

  const categories = ["icons", "illustrations", "lottie", "3d-assets", "animated-icons", "stickers"];
  const grouped: Record<string, { id: string; title: string; previewUrl: string; category: string }[]> = {};

  for (const cat of categories) {
    const rows = await dbAll<{ id: string; title: string; previewUrl: string; category: string }>(
      "SELECT id, title, previewUrl, category FROM Asset WHERE (title LIKE ? OR tags LIKE ?) AND category = ? ORDER BY downloads DESC LIMIT 6",
      [like, like, cat]
    );
    if (rows.length > 0) {
      grouped[cat] = rows;
    }
  }

  const tagRows = await dbAll<{ title: string }>(
    "SELECT DISTINCT title FROM Asset WHERE title LIKE ? ORDER BY downloads DESC LIMIT 8",
    [like]
  );

  return NextResponse.json({
    suggestions: tagRows.map((r) => r.title),
    grouped,
  });
}
