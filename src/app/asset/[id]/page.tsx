"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  Heart,
  ArrowLeft,
  Shield,
  Tag,
  Eye,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AssetGrid from "@/components/AssetGrid";
import { useStore } from "@/store/useStore";

const LottiePreview = dynamic(() => import("@/components/LottiePreview"), { ssr: false });

interface AssetDetail {
  id: string;
  title: string;
  description: string | null;
  previewUrl: string;
  sourceUrl: string;
  downloadUrl: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  license: string;
  fileFormat: string;
  fileSize: number | null;
  downloads: number;
  views: number;
  animated: boolean;
}

export default function AssetDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, bookmarkedAssetIds, addBookmark, removeBookmark } = useStore();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLicense, setShowLicense] = useState(false);

  const isBookmarked = asset ? bookmarkedAssetIds.has(asset.id) : false;

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data.asset);
        setSimilar(data.similar || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDownload = async (format?: string) => {
    if (!asset) return;

    // Track the download
    const res = await fetch("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: asset.id }),
    });
    const data = await res.json();

    // Build download URL based on format
    let url = data.downloadUrl || asset.downloadUrl || asset.previewUrl;

    if (format && url.includes("iconify.design")) {
      // Iconify supports format params
      const base = url.split("?")[0];
      if (format.startsWith("PNG")) {
        const size = format.includes("4x") ? 512 : format.includes("3x") ? 256 : format.includes("2x") ? 128 : 64;
        url = `${base}?width=${size}&height=${size}&format=png`;
      } else if (format === "SVG") {
        url = base;
      }
    }

    // Open in new tab
    window.open(url, "_blank");
    setShowLicense(false);
  };

  const toggleBookmark = async () => {
    if (!user || !asset) return;
    if (isBookmarked) removeBookmark(asset.id);
    else addBookmark(asset.id);
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: asset.id }),
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Asset not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Preview */}
        <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 flex items-center justify-center">
          {asset.previewUrl.endsWith(".json") || (asset.downloadUrl?.endsWith(".json") && asset.category === "lottie") ? (
            <LottiePreview
              url={asset.previewUrl.endsWith(".json") ? asset.previewUrl : asset.downloadUrl!}
              style={{ width: '70%', height: '70%' }}
            />
          ) : asset.category === "animated-icons" && asset.previewUrl.endsWith(".svg") ? (
            <object
              data={asset.previewUrl}
              type="image/svg+xml"
              className="pointer-events-none"
              style={{ width: '60%', height: '60%' }}
              aria-label={asset.title}
            >
              <img src={asset.previewUrl} alt={asset.title} style={{ width: '100%', height: '100%' }} className="object-contain" />
            </object>
          ) : (
            <img
              src={asset.previewUrl}
              alt={asset.title}
              className="object-contain"
              style={{ width: '60%', height: '60%' }}
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {asset.title}
          </h1>

          {asset.description && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              {asset.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Download className="w-4 h-4" /> {asset.downloads} downloads
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="w-4 h-4" /> {asset.views} views
            </span>
          </div>

          {/* License */}
          <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Shield className="w-5 h-5" />
              <span className="font-medium">{asset.license}</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              This asset is free to use under the {asset.license} license.
            </p>
          </div>

          {/* Tags */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <span className="text-gray-400">Format</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {asset.fileFormat}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <span className="text-gray-400">Category</span>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {asset.category.replace("-", " ")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setShowLicense(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all"
            >
              <Download className="w-5 h-5" /> Download
            </button>
            {asset.category === "lottie" && (asset.downloadUrl?.endsWith(".json") || asset.previewUrl.endsWith(".json")) && (
              <Link
                href={`/lottie-editor?asset=${asset.id}`}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Link>
            )}
            {user && (
              <button
                onClick={toggleBookmark}
                className={`flex items-center justify-center px-4 py-3 rounded-xl border transition-all ${
                  isBookmarked
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <Heart className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Download format modal */}
      {showLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLicense(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Preview in modal */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 p-2">
                <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{asset.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">{asset.license} License</span>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-400 capitalize">{asset.category.replace("-", " ")}</span>
                </div>
              </div>
            </div>

            {/* Format options */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose format:</p>

              {/* SVG — available for all SVG assets */}
              {(asset.fileFormat === "SVG" || ["icons", "illustrations", "animated-icons", "stickers", "lottie"].includes(asset.category)) && (
                <button onClick={() => handleDownload("SVG")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">SVG</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Vector (scalable)</span>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              )}

              {/* PNG options */}
              {[
                { label: "PNG 1x", fmt: "PNG 1x", size: "64px" },
                { label: "PNG 2x", fmt: "PNG 2x", size: "128px" },
                { label: "PNG 3x", fmt: "PNG 3x", size: "256px" },
                { label: "PNG 4x", fmt: "PNG 4x", size: "512px" },
              ].map((opt) => (
                <button key={opt.label} onClick={() => handleDownload(opt.fmt)} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">PNG</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label} ({opt.size})</span>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              ))}

              {/* JSON / Lottie for animated assets */}
              {(asset.category === "lottie" || asset.category === "animated-icons") && (
                <>
                  <button onClick={() => handleDownload("JSON")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs font-bold">JSON</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Lottie JSON</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDownload(".LOTTIE")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">.LOTTIE</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">dotLottie format</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                </>
              )}

              {/* AI / EPS for illustrations */}
              {asset.category === "illustrations" && (
                <>
                  <button onClick={() => handleDownload(".AI")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold">.AI</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Adobe Illustrator</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDownload(".EPS")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">.EPS</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Encapsulated PostScript</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                </>
              )}

              {/* 3D formats */}
              {asset.category === "3d-assets" && (
                <>
                  {[
                    { label: "GLB", desc: "glTF Binary (3D)" },
                    { label: "GLTF", desc: "glTF format (3D)" },
                    { label: "FBX", desc: "Autodesk FBX" },
                    { label: "OBJ", desc: "Wavefront OBJ" },
                    { label: "BLEND", desc: "Blender file" },
                  ].map((fmt) => (
                    <button key={fmt.label} onClick={() => handleDownload(fmt.label)} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">{fmt.label}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{fmt.desc}</span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={() => setShowLicense(false)}
              className="w-full mt-4 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Similar assets */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Similar Assets
          </h2>
          <AssetGrid assets={similar} />
        </section>
      )}
    </div>
  );
}
