"use client";

import Link from "next/link";

interface CategoryData {
  slug: string;
  name: string;
  description: string;
  featuredPreview: string;
  gradient: string;
}

export default function CategorySection({ categoryCounts, categoryPreviews }: {
  categoryCounts: Record<string, number>;
  categoryPreviews: Record<string, string[]>;
}) {
  const categories: CategoryData[] = [
    {
      slug: "3d-assets",
      name: "3D Icons",
      description: `Get ${(categoryCounts["3d-assets"] || 0).toLocaleString()}+ royalty-free 3D icons in PNG & SVG.`,
      featuredPreview: categoryPreviews["3d-assets"]?.[0] || "",
      gradient: "from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900",
    },
    {
      slug: "lottie",
      name: "Lottie Animations",
      description: `${(categoryCounts["lottie"] || 0).toLocaleString()}+ lightweight JSON animations for Web & Apps.`,
      featuredPreview: categoryPreviews["lottie"]?.[0] || "",
      gradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    },
    {
      slug: "illustrations",
      name: "Vector Illustrations",
      description: `Download ${(categoryCounts["illustrations"] || 0).toLocaleString()}+ editable, royalty-free SVG vectors.`,
      featuredPreview: categoryPreviews["illustrations"]?.[0] || "",
      gradient: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    },
    {
      slug: "icons",
      name: "SVG Icons",
      description: `${(categoryCounts["icons"] || 0).toLocaleString()}+ scalable vector icons (SVG & PNG) in all styles.`,
      featuredPreview: categoryPreviews["icons"]?.[0] || "",
      gradient: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20",
    },
    {
      slug: "animated-icons",
      name: "Animated Icons",
      description: `${(categoryCounts["animated-icons"] || 0).toLocaleString()}+ animated micro-interaction icons.`,
      featuredPreview: categoryPreviews["animated-icons"]?.[0] || "",
      gradient: "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20",
    },
    {
      slug: "stickers",
      name: "Stickers & Emojis",
      description: `${(categoryCounts["stickers"] || 0).toLocaleString()}+ fun stickers and emoji illustrations.`,
      featuredPreview: categoryPreviews["stickers"]?.[0] || "",
      gradient: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
    },
  ];

  return (
    <section className="py-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`}>
            <div className={`group relative h-full rounded-2xl bg-gradient-to-b ${cat.gradient} border border-gray-200/60 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300`}>
              {/* Text */}
              <div className="p-4 pb-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              {/* Single featured preview — large and prominent */}
              <div className="relative h-28 sm:h-36 flex items-end justify-center overflow-hidden px-4 pb-2">
                {cat.featuredPreview && (
                  <img
                    src={cat.featuredPreview.includes('iconify.design')
                      ? cat.featuredPreview + (cat.featuredPreview.includes('?') ? '&' : '?') + 'width=128&height=128'
                      : cat.featuredPreview}
                    alt={cat.name}
                    width={128}
                    height={128}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-lg"
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
