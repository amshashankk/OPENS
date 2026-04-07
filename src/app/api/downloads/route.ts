import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const { assetId } = await request.json();

  db.prepare("UPDATE Asset SET downloads = downloads + 1 WHERE id = ?").run(assetId);
  const asset = db.prepare("SELECT * FROM Asset WHERE id = ?").get(assetId) as Record<string, unknown>;

  const user = await getCurrentUser();
  if (user) {
    const id = "c" + randomBytes(12).toString("hex");
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO Download (id, userId, assetId, createdAt) VALUES (?, ?, ?, ?)"
    ).run(id, user.id, assetId, now);
  }

  return NextResponse.json({
    downloadUrl: asset.downloadUrl || asset.sourceUrl,
    asset: { ...asset, tags: JSON.parse(asset.tags as string) },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const downloads = db.prepare(`
    SELECT d.createdAt as downloadedAt, a.*
    FROM Download d JOIN Asset a ON d.assetId = a.id
    WHERE d.userId = ?
    ORDER BY d.createdAt DESC LIMIT 50
  `).all(user.id) as Record<string, unknown>[];

  return NextResponse.json({
    downloads: downloads.map((d) => ({
      asset: { ...d, tags: JSON.parse(d.tags as string), featured: Boolean(d.featured), animated: Boolean(d.animated) },
    })),
  });
}
