"use client";

import AssetGrid from "./AssetGrid";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

interface Asset {
  id: string;
  title: string;
  previewUrl: string;
  category: string;
  tags: string[];
  license: string;
  fileFormat: string;
  downloads: number;
  animated?: boolean;
}

export default function HomeSections({
  featured,
  categoryAssets,
}: {
  featured: Asset[];
  categoryAssets: Record<string, Asset[]>;
}) {
  return (
    <>
      {/* Trending */}
      <section className="py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trending Assets
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Most popular this week
            </p>
          </div>
        </div>
        <AssetGrid assets={featured} />
      </section>

      {/* Per-category sections */}
      {CATEGORIES.map((cat) => (
        <section key={cat.slug} className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {cat.name}
            </h2>
            <Link
              href={`/category/${cat.slug}`}
              className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <AssetGrid assets={categoryAssets[cat.slug] || []} />
        </section>
      ))}
    </>
  );
}
