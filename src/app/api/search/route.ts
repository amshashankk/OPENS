import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/parseTags";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const license = searchParams.get("license");
  const format = searchParams.get("format");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (q) {
    conditions.push("(title LIKE ? OR tags LIKE ? OR description LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (license) {
    conditions.push("license = ?");
    params.push(license);
  }
  if (format) {
    conditions.push("fileFormat = ?");
    params.push(format);
  }

  const where = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  const total = (db.prepare(`SELECT COUNT(*) as count FROM Asset${where}`).get(...params) as { count: number }).count;
  const assets = db.prepare(`SELECT * FROM Asset${where} ORDER BY downloads DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Record<string, unknown>[];

  return NextResponse.json({
    assets: assets.map((a) => ({ ...a, tags: parseTags(a.tags), featured: Boolean(a.featured), animated: Boolean(a.animated) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
