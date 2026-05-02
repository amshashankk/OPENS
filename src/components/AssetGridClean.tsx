"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import AssetPreview from "./AssetPreview";

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

function AssetCardClean({ asset }: { asset: Asset }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/asset/${asset.id}`}>
      <div
        className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Preview — clean, large, centered */}
        <div className="aspect-square bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-center p-5 relative">
          <AssetPreview
            previewUrl={asset.previewUrl}
            downloadUrl={asset.downloadUrl}
            category={asset.category}
            title={asset.title}
            className="group-hover:scale-105 transition-transform duration-300"
            style={{ width: '75%', height: '75%' }}
            isHovered={hovered}
          />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-200" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const url = asset.downloadUrl || asset.previewUrl; const fname = `${(asset.title || "asset").replace(/[^a-zA-Z0-9]/g, "-")}.svg`; const a = document.createElement("a"); a.href = `/api/proxy-image?url=${encodeURIComponent(url)}&download=1&filename=${encodeURIComponent(fname)}`; a.download = fname; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-violet-500 hover:text-white hover:border-violet-500 text-gray-600 dark:text-gray-400 transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title tooltip on hover */}
          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-gradient-to-t from-black/60 to-transparent px-3 py-2 pt-6">
              <p className="text-white text-xs font-medium truncate">{asset.title}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonClean() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export default function AssetGridClean({
  assets,
  loading,
}: {
  assets: Asset[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {Array.from({ length: 40 }).map((_, i) => (
          <SkeletonClean key={i} />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">No assets found</p>
        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {assets.map((asset) => (
        <AssetCardClean key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
