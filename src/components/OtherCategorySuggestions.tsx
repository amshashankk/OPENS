"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Box, Paintbrush, Play, Layers, Sparkles, Smile, ArrowRight } from "lucide-react";
import AssetGridClean from "./AssetGridClean";
import { CATEGORIES } from "@/lib/categories";

interface Asset {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl?: string | null;
  category: string;
  tags: string[];
  license: string;
  fileFormat: string;
  downloads: number;
  animated?: boolean;
}

const meta: Record<string, { label: string; icon: typeof Box; color: string; bg: string }> = {
  icons: { label: "Icons", icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  illustrations: { label: "Illustrations", icon: Paintbrush, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
  lottie: { label: "Lottie Animations", icon: Play, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  "3d-assets": { label: "3D Assets", icon: Box, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "animated-icons": { label: "Animated Icons", icon: Sparkles, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20" },
  stickers: { label: "Stickers & Emojis", icon: Smile, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
};

interface Props {
  query: string;
  excludeCategory: string;
}

/**
 * Renders "More for '<q>' in <Category>" sections for every category
 * other than the one the user is currently viewing.
 *
 * Each section shows up to 8 results; a "View all" link goes to the
 * full search-by-category view.
 */
export default function OtherCategorySuggestions({ query, excludeCategory }: Props) {
  const [results, setResults] = useState<Record<string, Asset[]>>({});
  const others = CATEGORIES.map((c) => c.slug).filter((s) => s !== excludeCategory);

  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    (async () => {
      const out: Record<string, Asset[]> = {};
      await Promise.all(
        others.map(async (cat) => {
          try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=${cat}&limit=8&page=1`);
            const data = await res.json();
            if (Array.isArray(data.assets) && data.assets.length > 0) {
              out[cat] = data.assets;
            }
          } catch {
            /* ignore — best effort */
          }
        })
      );
      if (!cancelled) setResults(out);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, excludeCategory]);

  const populated = Object.entries(results);
  if (populated.length === 0) return null;

  return (
    <div className="mt-12 pt-10 border-t border-gray-200 dark:border-gray-800 space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          More for &ldquo;{query}&rdquo; in other categories
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Try these matching results from elsewhere on OPENS.
        </p>
      </div>

      {populated.map(([cat, catAssets], idx) => {
        const m = meta[cat];
        if (!m) return null;
        const Icon = m.icon;
        return (
          <motion.section
            key={cat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{m.label}</h3>
                  <p className="text-xs text-gray-500">{catAssets.length} match{catAssets.length !== 1 ? "es" : ""}</p>
                </div>
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(query)}&category=${cat}`}
                className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <AssetGridClean assets={catAssets} />
          </motion.section>
        );
      })}
    </div>
  );
}
