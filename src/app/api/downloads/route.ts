import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseTags } from "@/lib/parseTags";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required to download" }, { status: 401 });
  }

  const { assetId } = await request.json();

  await dbRun("UPDATE Asset SET downloads = downloads + 1 WHERE id = ?", [assetId]);
  const asset = await dbGet<Record<string, unknown>>(
    "SELECT * FROM Asset WHERE id = ?",
    [assetId]
  );

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const id = "c" + randomBytes(12).toString("hex");
  const now = new Date().toISOString();
  await dbRun(
    "INSERT INTO Download (id, userId, assetId, createdAt) VALUES (?, ?, ?, ?)",
    [id, user.id, assetId, now]
  );

  return NextResponse.json({
    downloadUrl: asset.downloadUrl || asset.sourceUrl,
    asset: { ...asset, tags: parseTags(asset.tags) },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const downloads = await dbAll<Record<string, unknown>>(
    `
    SELECT d.createdAt as downloadedAt, a.*
    FROM Download d JOIN Asset a ON d.assetId = a.id
    WHERE d.userId = ?
    ORDER BY d.createdAt DESC LIMIT 50
  `,
    [user.id]
  );

  return NextResponse.json({
    downloads: downloads.map((d) => ({
      asset: { ...d, tags: parseTags(d.tags), featured: Boolean(d.featured), animated: Boolean(d.animated) },
    })),
  });
}
