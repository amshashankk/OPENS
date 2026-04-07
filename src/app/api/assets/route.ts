import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM Asset";
  let countQuery = "SELECT COUNT(*) as count FROM Asset";
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (featured === "true") {
    conditions.push("featured = 1");
  }

  if (conditions.length) {
    const where = " WHERE " + conditions.join(" AND ");
    query += where;
    countQuery += where;
  }

  query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";

  const total = (db.prepare(countQuery).get(...params) as { count: number }).count;
  const assets = db.prepare(query).all(...params, limit, offset) as Record<string, unknown>[];

  return NextResponse.json({
    assets: assets.map((a) => ({ ...a, tags: JSON.parse(a.tags as string), featured: Boolean(a.featured), animated: Boolean(a.animated) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
