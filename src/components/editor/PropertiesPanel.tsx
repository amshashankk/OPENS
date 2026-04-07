"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { Settings, Maximize } from "lucide-react";

export default function PropertiesPanel() {
  const {
    animationJson, dimensions, setDimensions, frameRate, setFrameRate,
    animationName, setAnimationName, bgColor, setBgColor,
    totalFrames, selectedLayerIndex,
  } = useEditorStore();

  if (!animationJson) return null;

  const selectedLayer = selectedLayerIndex !== null ? animationJson.layers[selectedLayerIndex] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <Settings className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Animation Name */}
        <div>
          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
          <input
            type="text"
            value={animationName}
            onChange={(e) => setAnimationName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Maximize className="w-3 h-3" /> Dimensions
          </label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <span className="text-[10px] text-gray-400">W</span>
              <input
                type="number"
                value={dimensions.w}
                onChange={(e) => setDimensions(parseInt(e.target.value) || 1, dimensions.h)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-gray-400">H</span>
              <input
                type="number"
                value={dimensions.h}
                onChange={(e) => setDimensions(dimensions.w, parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Frame Rate</label>
          <input
            type="number"
            value={frameRate}
            onChange={(e) => setFrameRate(parseInt(e.target.value) || 1)}
            min={1}
            max={120}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Total Frames (read-only) */}
        <div>
          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Frames</label>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-mono">{totalFrames}</p>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Background</label>
          <div className="flex items-center gap-2 mt-1">
            <label className="relative cursor-pointer">
              <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: bgColor }} />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <span className="text-xs text-gray-500 font-mono uppercase">{bgColor}</span>
          </div>
        </div>

        {/* Selected Layer */}
        {selectedLayer && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-[11px] font-medium text-violet-500 uppercase tracking-wide mb-3">
              Selected Layer
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-900 dark:text-white font-medium truncate ml-2">
                  {(selectedLayer.nm as string) || "Unnamed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-900 dark:text-white">
                  {({ 0: "Precomp", 1: "Solid", 2: "Image", 3: "Null", 4: "Shape", 5: "Text" } as Record<number, string>)[(selectedLayer.ty as number)] || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">In Frame</span>
                <span className="text-gray-900 dark:text-white font-mono">{selectedLayer.ip as number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Out Frame</span>
                <span className="text-gray-900 dark:text-white font-mono">{selectedLayer.op as number}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
