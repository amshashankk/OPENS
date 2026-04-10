import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const like = `%${q}%`;

  // Get grouped results by category (up to 3 per category)
  const categories = ["icons", "illustrations", "lottie", "3d-assets", "animated-icons", "stickers"];
  const grouped: Record<string, { id: string; title: string; previewUrl: string; category: string }[]> = {};

  for (const cat of categories) {
    const rows = db
      .prepare(
        "SELECT id, title, previewUrl, category FROM Asset WHERE (title LIKE ? OR tags LIKE ?) AND category = ? ORDER BY downloads DESC LIMIT 3"
      )
      .all(like, like, cat) as { id: string; title: string; previewUrl: string; category: string }[];
    if (rows.length > 0) {
      grouped[cat] = rows;
    }
  }

  // Also get top 5 matching tag suggestions
  const tagRows = db
    .prepare("SELECT DISTINCT title FROM Asset WHERE title LIKE ? ORDER BY downloads DESC LIMIT 8")
    .all(like) as { title: string }[];

  return NextResponse.json({
    suggestions: tagRows.map((r) => r.title),
    grouped,
  });
}
