"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { Download, Copy, Check, FileJson, Layers, Palette, Clock } from "lucide-react";
import { useState } from "react";

export default function ExportPanel() {
  const { animationJson, fileName, dimensions, frameRate, totalFrames, colors } = useEditorStore();
  const [copied, setCopied] = useState(false);

  if (!animationJson) return null;

  const jsonStr = JSON.stringify(animationJson, null, 2);
  const minStr = JSON.stringify(animationJson);
  const sizeKB = (new Blob([minStr]).size / 1024).toFixed(1);
  const layers = animationJson.layers?.length || 0;

  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".json") ? fileName : fileName + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = (minified: boolean) => {
    navigator.clipboard.writeText(minified ? minStr : jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <FileJson className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Layers, label: "Layers", value: layers },
            { icon: Palette, label: "Colors", value: colors.length },
            { icon: Clock, label: "Frames", value: totalFrames },
            { icon: FileJson, label: "Size", value: `${sizeKB} KB` },
          ].map((stat) => (
            <div key={stat.label} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
              <stat.icon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>{dimensions.w} x {dimensions.h}px &middot; {frameRate} fps</p>
          <p className="font-mono text-[10px] truncate text-gray-400">{fileName}</p>
        </div>

        {/* Download */}
        <button
          onClick={downloadJSON}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm hover:from-violet-600 hover:to-fuchsia-600 transition-all"
        >
          <Download className="w-4 h-4" /> Download JSON
        </button>

        {/* Copy */}
        <div className="flex gap-2">
          <button
            onClick={() => copyJSON(false)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={() => copyJSON(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Minified
          </button>
        </div>
      </div>
    </div>
  );
}
