"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Download } from "lucide-react";
import { useStore } from "@/store/useStore";
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

export default function AssetCard({ asset }: { asset: Asset }) {
  const { user, bookmarkedAssetIds, addBookmark, removeBookmark } = useStore();
  const isBookmarked = bookmarkedAssetIds.has(asset.id);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    if (isBookmarked) {
      removeBookmark(asset.id);
    } else {
      addBookmark(asset.id);
    }

    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: asset.id }),
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      icons: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      illustrations: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      lottie: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      "animated-icons": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      stickers: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "3d-assets": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    };
    return colors[category] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  };

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/asset/${asset.id}`}>
      <div
        className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Preview */}
        <div className="aspect-square bg-gray-50 dark:bg-gray-800/50 p-6 flex items-center justify-center overflow-hidden relative">
          <AssetPreview
            previewUrl={asset.previewUrl}
            downloadUrl={asset.downloadUrl}
            category={asset.category}
            title={asset.title}
            className="group-hover:scale-110 transition-transform duration-500"
            style={{ width: '60%', height: '60%' }}
            isHovered={hovered}
          />

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-300 flex items-start justify-end p-3 opacity-0 group-hover:opacity-100">
            {user && (
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                  isBookmarked
                    ? "bg-red-500 text-white"
                    : "bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {asset.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(asset.category)}`}>
              {asset.fileFormat.toUpperCase()}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Download className="w-3 h-3" />
              {asset.downloads}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
