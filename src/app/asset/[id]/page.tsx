"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ExternalLink,
  Heart,
  ArrowLeft,
  Shield,
  Tag,
  Eye,
  Pencil,
  Box,
  Paintbrush,
  Play,
  Layers,
  Sparkles,
  Smile,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AssetGrid from "@/components/AssetGrid";
import AssetGridClean from "@/components/AssetGridClean";
import { useStore } from "@/store/useStore";

const LottiePreview = dynamic(() => import("@/components/LottiePreview"), { ssr: false });

const categoryMeta: Record<string, { label: string; icon: typeof Box; color: string }> = {
  icons: { label: "Icons", icon: Layers, color: "text-emerald-500" },
  illustrations: { label: "Illustrations", icon: Paintbrush, color: "text-violet-500" },
  lottie: { label: "Lottie Animations", icon: Play, color: "text-amber-500" },
  "3d-assets": { label: "3D Assets", icon: Box, color: "text-blue-500" },
  "animated-icons": { label: "Animated Icons", icon: Sparkles, color: "text-sky-500" },
  stickers: { label: "Stickers", icon: Smile, color: "text-rose-500" },
};

interface AssetDetail {
  id: string;
  title: string;
  description: string | null;
  previewUrl: string;
  sourceUrl: string;
  downloadUrl?: string | null;
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
  const { user, bookmarkedAssetIds, addBookmark, removeBookmark, openLoginModal } = useStore();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [similar, setSimilar] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLicense, setShowLicense] = useState(false);

  const isBookmarked = asset ? bookmarkedAssetIds.has(asset.id) : false;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data.asset);
        setSimilar(data.similar || []);
        setRelated(data.related || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDownload = async (format?: string) => {
    if (!asset) return;
    const res = await fetch("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: asset.id }),
    });
    if (res.status === 401) {
      openLoginModal();
      return;
    }
    const data = await res.json();
    let url = data.downloadUrl || asset.downloadUrl || asset.previewUrl;
    if (format && url.includes("iconify.design")) {
      const base = url.split("?")[0];
      if (format.startsWith("PNG")) {
        const size = format.includes("4x") ? 512 : format.includes("3x") ? 256 : format.includes("2x") ? 128 : 64;
        url = `${base}?width=${size}&height=${size}&format=png`;
      } else if (format === "SVG") {
        url = base;
      }
    }
    // Route through proxy for reliable download
    const ext = format?.startsWith("PNG") ? "png" : url.endsWith(".json") ? "json" : "svg";
    const filename = `${(asset.title || "asset").replace(/[^a-zA-Z0-9]/g, "-")}.${ext}`;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}&download=1&filename=${encodeURIComponent(filename)}`;

    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // Group related by category
  const relatedGrouped = (related as AssetDetail[]).reduce<Record<string, AssetDetail[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Preview */}
        <motion.div
          className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {asset.previewUrl.endsWith(".json") || (asset.downloadUrl?.endsWith(".json") && asset.category === "lottie") ? (
            <LottiePreview
              url={asset.previewUrl.endsWith(".json") ? asset.previewUrl : asset.downloadUrl!}
              style={{ width: '70%', height: '70%' }}
              alwaysPlay
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
            <img src={asset.previewUrl} alt={asset.title} className="object-contain" style={{ width: '60%', height: '60%' }} />
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{asset.title}</h1>

          {asset.description && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">{asset.description}</p>
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
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <span className="text-gray-400">Format</span>
              <p className="font-medium text-gray-900 dark:text-white">{asset.fileFormat}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <span className="text-gray-400">Category</span>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{asset.category.replace("-", " ")}</p>
            </div>
          </div>

          {/* Explore more */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Explore more</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryMeta).map(([slug, meta]) => {
                const Icon = meta.icon;
                return (
                  <Link
                    key={slug}
                    href={`/category/${slug}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors ${
                      slug === asset.category ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" : ""
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    {meta.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setShowLicense(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all hover:shadow-lg hover:shadow-violet-500/25"
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
        </motion.div>
      </div>

      {/* Download format modal */}
      <AnimatePresence>
        {showLicense && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLicense(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
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

              <div className="space-y-2 max-h-80 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose format:</p>

                {(asset.fileFormat === "SVG" || ["icons", "illustrations", "animated-icons", "stickers", "lottie"].includes(asset.category)) && (
                  <button onClick={() => handleDownload("SVG")} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">SVG</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Vector (scalable)</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                )}

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Similar assets (same category) */}
      {similar.length > 0 && (
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Similar {categoryMeta[asset.category]?.label || "Assets"}
            </h2>
            <Link
              href={`/category/${asset.category}`}
              className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <AssetGridClean assets={similar} />
        </motion.section>
      )}

      {/* Related from other categories */}
      {Object.keys(relatedGrouped).length > 0 && (
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Related in Other Categories
          </h2>
          <div className="space-y-8">
            {Object.entries(relatedGrouped).map(([cat, items]) => {
              const meta = categoryMeta[cat];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{meta.label}</span>
                    </div>
                    <Link
                      href={`/search?q=${encodeURIComponent(asset.tags[0] || asset.title)}&category=${cat}`}
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <AssetGridClean assets={items.slice(0, 6) as any} />
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
