import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });

  // Only proxy allowed domains
  const allowed = ["img.icons8.com", "icons8.com", "maxst.icons8.com"];
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

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
