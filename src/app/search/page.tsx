"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useCachedFetch } from "@/lib/useCachedFetch";
import AssetGridClean from "@/components/AssetGridClean";
import CategoryTabs from "@/components/CategoryTabs";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import { Box, Paintbrush, Play, Layers, Sparkles, Smile, ArrowRight } from "lucide-react";

const categoryMeta: Record<string, { label: string; icon: typeof Box; color: string; bg: string }> = {
  icons: { label: "Icons", icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  illustrations: { label: "Illustrations", icon: Paintbrush, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
  lottie: { label: "Lottie Animations", icon: Play, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  "3d-assets": { label: "3D Assets", icon: Box, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "animated-icons": { label: "Animated Icons", icon: Sparkles, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20" },
  stickers: { label: "Stickers & Emojis", icon: Smile, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
};

interface Asset {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl?: string;
  category: string;
  tags: string[];
  license: string;
  fileFormat: string;
  downloads: number;
  animated?: boolean;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryParam) params.set("category", categoryParam);
  params.set("page", String(page));
  params.set("limit", "40");
  const url = `/api/search?${params}`;
  const { data, loading } = useCachedFetch<{ assets: Asset[]; total: number; totalPages: number }>(url, { freshFor: 60_000 });

  const assets = data?.assets || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Group assets by category when no specific category is selected and there's a query
  const grouped = !categoryParam && q && !loading
    ? assets.reduce<Record<string, Asset[]>>((acc, asset) => {
        if (!acc[asset.category]) acc[asset.category] = [];
        acc[asset.category].push(asset);
        return acc;
      }, {})
    : null;

  const showGrouped = grouped && Object.keys(grouped).length > 1;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Category tabs */}
      <CategoryTabs activeCategory={categoryParam} />

      {/* Header */}
      <motion.div
        className="mt-4 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {q ? `Results for "${q}"` : categoryParam ? categoryParam.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) : "All Assets"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total.toLocaleString()} free assets
        </p>
      </motion.div>

      {/* Category-grouped view */}
      {showGrouped ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, catAssets], idx) => {
            const meta = categoryMeta[cat];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <motion.section
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{meta.label}</h2>
                      <p className="text-xs text-gray-500">{catAssets.length} result{catAssets.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&category=${cat}`}
                    className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <AssetGridClean assets={catAssets.slice(0, 8)} />
              </motion.section>
            );
          })}
        </div>
      ) : (
        <>
          <AssetGridClean assets={assets} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}

      {/* Still show pagination for grouped when there are many results */}
      {showGrouped && totalPages > 1 && (
        <div className="mt-8">
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
