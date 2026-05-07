import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import HomeSections from "@/components/HomeSections";
import { dbGet, dbAll } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { parseTags } from "@/lib/parseTags";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Home() {
  const [totalRow, countRows, lottieGif, featured, ...catResults] = await Promise.all([
    dbGet<{ c: number }>("SELECT COUNT(*) as c FROM Asset"),
    dbAll<{ category: string; count: number }>(
      "SELECT category, COUNT(*) as count FROM Asset GROUP BY category"
    ),
    dbGet<{ previewUrl: string }>(
      "SELECT previewUrl FROM Asset WHERE category = 'lottie' AND previewUrl LIKE '%.gif' ORDER BY downloads DESC LIMIT 1"
    ),
    dbAll<Record<string, unknown>>(
      "SELECT * FROM (SELECT * FROM Asset WHERE featured = 1 ORDER BY downloads DESC LIMIT 50) GROUP BY previewUrl LIMIT 12"
    ),
    ...CATEGORIES.map((cat) =>
      dbAll<Record<string, unknown>>(
        "SELECT * FROM (SELECT * FROM Asset WHERE category = ? ORDER BY downloads DESC LIMIT 60) GROUP BY title LIMIT 6",
        [cat.slug]
      )
    ),
  ]);

  const totalAssets = totalRow?.c ?? 0;
  const categoryCounts: Record<string, number> = {};
  for (const row of countRows) categoryCounts[row.category] = row.count;

  const featuredPreviews: Record<string, string> = {
    "3d-assets": "https://api.iconify.design/noto-v1/rocket.svg",
    "lottie": "",
    "illustrations": "https://api.iconify.design/twemoji/artist-palette.svg",
    "icons": "https://api.iconify.design/fluent/apps-24-filled.svg",
    "animated-icons": "https://api.iconify.design/fluent-emoji-flat/sparkles.svg",
    "stickers": "https://api.iconify.design/fluent-emoji/smiling-face-with-heart-eyes.svg",
  };
  if (lottieGif) featuredPreviews["lottie"] = lottieGif.previewUrl;

  const categoryPreviews: Record<string, string[]> = {};
  for (const cat of CATEGORIES) {
    categoryPreviews[cat.slug] = featuredPreviews[cat.slug] ? [featuredPreviews[cat.slug]] : [];
  }

  const categoryAssets: Record<string, Record<string, unknown>[]> = {};
  CATEGORIES.forEach((cat, i) => {
    categoryAssets[cat.slug] = catResults[i] ?? [];
  });

  const parse = (a: Record<string, unknown>) => ({
    ...a,
    tags: parseTags(a.tags),
    featured: Boolean(a.featured),
    animated: Boolean(a.animated),
  }) as any;

  return (
    <div>
      <HeroSection totalAssets={totalAssets} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategorySection categoryCounts={categoryCounts} categoryPreviews={categoryPreviews} />
        <HomeSections
          featured={featured.map(parse)}
          categoryAssets={Object.fromEntries(
            Object.entries(categoryAssets).map(([k, v]) => [k, v.map(parse)])
          )}
        />
      </div>
    </div>
  );
}
