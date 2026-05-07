import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const download = req.nextUrl.searchParams.get("download");
  const filename = req.nextUrl.searchParams.get("filename");

  if (!url) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });

  if (download) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required to download" }, { status: 401 });
    }
  }

  // Allow proxy for known safe domains
  const allowed = ["img.icons8.com", "icons8.com", "maxst.icons8.com", "api.iconify.design", "www.svgrepo.com", "svgrepo.com"];
  try {
    const parsed = new URL(url);
    if (!allowed.some(d => parsed.hostname.endsWith(d))) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://icons8.com/",
        "Accept": "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/svg+xml";
    const buffer = await response.arrayBuffer();

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      // Netlify ignores arbitrary query params for cache key by default,
      // collapsing all proxy responses onto one entry. Tell it to vary
      // by `url`, `download`, and `filename` so each unique image / download
      // gets its own cache entry.
      "Netlify-Vary": "query=url|download|filename",
      "Access-Control-Allow-Origin": "*",
    };

    // Force download if requested
    if (download) {
      const fname = filename || "download.svg";
      headers["Content-Disposition"] = `attachment; filename="${fname}"`;
    }

    return new NextResponse(buffer, { headers });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
