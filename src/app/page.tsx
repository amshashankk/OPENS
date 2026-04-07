import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import HomeSections from "@/components/HomeSections";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";

export default function Home() {
  // Total asset count
  const totalAssets = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;

  // Category counts
  const countRows = db.prepare("SELECT category, COUNT(*) as count FROM Asset GROUP BY category").all() as Array<{ category: string; count: number }>;
  const categoryCounts: Record<string, number> = {};
  for (const row of countRows) categoryCounts[row.category] = row.count;

  // Category preview icons (4 per category)
  const categoryPreviews: Record<string, string[]> = {};
  // Hand-picked visually rich featured previews per category
  const featuredPreviews: Record<string, string> = {
    "3d-assets": "https://api.iconify.design/noto-v1/rocket.svg",
    "lottie": "", // will be filled from DB (GIF)
    "illustrations": "https://api.iconify.design/twemoji/artist-palette.svg",
    "icons": "https://api.iconify.design/fluent/apps-24-filled.svg",
    "animated-icons": "https://api.iconify.design/fluent-emoji-flat/sparkles.svg",
    "stickers": "https://api.iconify.design/fluent-emoji/smiling-face-with-heart-eyes.svg",
  };
  // For Lottie, pick a GIF preview from the DB
  const lottieGif = db.prepare(
    "SELECT previewUrl FROM Asset WHERE category = 'lottie' AND previewUrl LIKE '%.gif' ORDER BY RANDOM() LIMIT 1"
  ).get() as { previewUrl: string } | undefined;
  if (lottieGif) featuredPreviews["lottie"] = lottieGif.previewUrl;

  for (const cat of CATEGORIES) {
    categoryPreviews[cat.slug] = featuredPreviews[cat.slug] ? [featuredPreviews[cat.slug]] : [];
  }

  // Featured assets
  const featured = db
    .prepare("SELECT * FROM Asset WHERE featured = 1 ORDER BY downloads DESC LIMIT 12")
    .all() as Record<string, unknown>[];

  // Per-category assets
  const categoryAssets: Record<string, Record<string, unknown>[]> = {};
  for (const cat of CATEGORIES) {
    categoryAssets[cat.slug] = db
      .prepare("SELECT * FROM Asset WHERE category = ? ORDER BY downloads DESC LIMIT 6")
      .all(cat.slug) as Record<string, unknown>[];
  }

  const parse = (a: Record<string, unknown>) => ({
    ...a,
    tags: JSON.parse(a.tags as string),
    featured: Boolean(a.featured),
    animated: Boolean(a.animated),
  });

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
