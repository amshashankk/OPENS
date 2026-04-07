"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Upload, Link2, FolderOpen, X, FileJson, Sparkles } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

const LottieCanvas = dynamic(() => import("@/components/editor/LottieCanvas"), { ssr: false });
import TimelineControls from "@/components/editor/TimelineControls";
import ColorPanel from "@/components/editor/ColorPanel";
import LayerPanel from "@/components/editor/LayerPanel";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import ExportPanel from "@/components/editor/ExportPanel";

function EditorContent() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get("asset");
  const { animationJson, setAnimationJson, reset } = useEditorStore();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"layers" | "colors" | "properties" | "export">("layers");

  // Load from OPENS library if asset ID in URL
  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    fetch(`/api/assets/${assetId}`)
      .then((r) => r.json())
      .then(async (data) => {
        const asset = data.asset;
        if (!asset) throw new Error("Asset not found");
        const jsonUrl = asset.downloadUrl || asset.previewUrl;
        if (!jsonUrl?.endsWith(".json")) throw new Error("Not a JSON Lottie file");
        const res = await fetch(jsonUrl);
        const json = await res.json();
        if (!json.v) throw new Error("Invalid Lottie file");
        setAnimationJson(json, asset.title + ".json", assetId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [assetId]);

  const loadFromUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(urlInput.trim());
      const json = await res.json();
      if (!json.v) throw new Error("Invalid Lottie JSON (missing 'v' property)");
      setAnimationJson(json, urlInput.split("/").pop() || "animation.json");
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const loadFromFile = (file: File) => {
    setLoading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.v) throw new Error("Invalid Lottie JSON");
        setAnimationJson(json, file.name);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) loadFromFile(file);
    else setError("Please drop a .json file");
  }, []);

  // Empty state — load animation UI
  if (!animationJson) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lottie Editor</h1>
            <p className="text-gray-500 mt-2">Edit colors, layers, speed, and more in any Lottie animation</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-4 text-center text-violet-500 text-sm">Loading animation...</div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
          >
            <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Drag & drop a Lottie JSON file here
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-medium cursor-pointer hover:bg-violet-600 transition-colors">
              <FolderOpen className="w-4 h-4" /> Browse Files
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && loadFromFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          {/* URL input */}
          <div className="mt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="Paste Lottie JSON URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadFromUrl()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <button
                onClick={loadFromUrl}
                disabled={!urlInput.trim() || loading}
                className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Load
              </button>
            </div>
          </div>

          {/* Sample */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-2">Or try a sample:</p>
            <button
              onClick={() => {
                setUrlInput("https://assets2.lottiefiles.com/packages/lf20_UJNc2t.json");
                loadFromUrl();
              }}
              className="text-xs text-violet-500 hover:text-violet-600 underline"
            >
              Load sample animation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Editor layout
  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Left sidebar — Layers + Properties */}
      <div className="hidden lg:flex flex-col w-[280px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <LayerPanel />
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-800" />
          <div className="flex-1 overflow-hidden">
            <PropertiesPanel />
          </div>
        </div>
      </div>

      {/* Center — Canvas + Timeline */}
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
              {useEditorStore.getState().fileName}
            </span>
          </div>
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>

        <LottieCanvas />
        <TimelineControls />
      </div>

      {/* Right sidebar — Colors + Export */}
      <div className="hidden lg:flex flex-col w-[300px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex-1 overflow-hidden">
          <ColorPanel />
        </div>
        <div className="h-px bg-gray-200 dark:bg-gray-800" />
        <div className="shrink-0">
          <ExportPanel />
        </div>
      </div>

      {/* Mobile tabs — shown below lg */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {(["layers", "colors", "properties", "export"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-violet-600 border-b-2 border-violet-500"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="h-64 overflow-hidden">
          {activeTab === "layers" && <LayerPanel />}
          {activeTab === "colors" && <ColorPanel />}
          {activeTab === "properties" && <PropertiesPanel />}
          {activeTab === "export" && <ExportPanel />}
        </div>
      </div>
    </div>
  );
}

export default function LottieEditorPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500">Loading editor...</div>}>
        <EditorContent />
      </Suspense>
    </div>
  );
}
