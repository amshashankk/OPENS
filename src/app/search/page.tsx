"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import AssetGridClean from "@/components/AssetGridClean";
import CategoryTabs from "@/components/CategoryTabs";
import Pagination from "@/components/Pagination";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryParam) params.set("category", categoryParam);
    params.set("page", String(page));
    params.set("limit", "40");

    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [q, categoryParam, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Category tabs */}
      <CategoryTabs activeCategory={categoryParam} />

      {/* Header */}
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {q ? `Results for "${q}"` : categoryParam ? categoryParam.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) : "All Assets"}
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
