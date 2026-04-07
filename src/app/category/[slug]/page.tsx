"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AssetGridClean from "@/components/AssetGridClean";
import CategoryTabs from "@/components/CategoryTabs";
import Pagination from "@/components/Pagination";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const category = CATEGORIES.find((c) => c.slug === slug);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("category", slug);
    params.set("page", String(page));
    params.set("limit", "40");

    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [slug, page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Category tabs */}
      <CategoryTabs activeCategory={slug} />

      {/* Header */}
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {category?.name || slug}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total.toLocaleString()} free assets
        </p>
      </div>

      {/* Grid */}
      <AssetGridClean assets={assets} loading={loading} />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </div>
  );
}
