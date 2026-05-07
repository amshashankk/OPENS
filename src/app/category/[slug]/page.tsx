"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import AssetGridClean from "@/components/AssetGridClean";
import CategoryTabs from "@/components/CategoryTabs";
import Pagination from "@/components/Pagination";
import { CATEGORIES } from "@/lib/categories";
import { useCachedFetch } from "@/lib/useCachedFetch";

interface CategoryAsset {
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

interface SearchResponse {
  assets: CategoryAsset[];
  total: number;
  totalPages: number;
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const category = CATEGORIES.find((c) => c.slug === slug);
  const [page, setPage] = useState(1);

  const url = `/api/search?category=${encodeURIComponent(slug)}&page=${page}&limit=40`;
  const { data, loading } = useCachedFetch<SearchResponse>(url, { freshFor: 60_000 });

  const assets = data?.assets || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <CategoryTabs activeCategory={slug} />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {category?.name || slug}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total.toLocaleString()} free assets
        </p>
      </div>

      <AssetGridClean assets={assets} loading={loading && !data} />

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </div>
  );
}
