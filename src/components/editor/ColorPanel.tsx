"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { rgbaToHex, hexToRgba } from "@/lib/lottieColors";
import { RotateCcw, Palette } from "lucide-react";
import { useRef } from "react";

export default function ColorPanel() {
  const { colors, updateColor, animationJson } = useEditorStore();
  const originalColorsRef = useRef<Map<string, [number, number, number, number]>>(new Map());

  // Store originals on first render
  if (originalColorsRef.current.size === 0 && colors.length > 0) {
    colors.forEach((c) => originalColorsRef.current.set(c.path, [...c.value]));
  }

  if (!animationJson) return null;

  const resetColor = (path: string) => {
    const original = originalColorsRef.current.get(path);
    if (original) updateColor(path, original);
  };

  const resetAll = () => {
    originalColorsRef.current.forEach((val, path) => {
      updateColor(path, val);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Colors</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
            {colors.length}
          </span>
        </div>
        {colors.length > 0 && (
          <button
            onClick={resetAll}
            className="text-xs text-gray-400 hover:text-violet-500 transition-colors"
            title="Reset all colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {colors.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No editable colors found</p>
        )}

        {colors.map((color, i) => {
          const hex = rgbaToHex(color.value);
          return (
            <div
              key={`${color.path}-${i}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              {/* Color swatch with native picker */}
              <label className="relative cursor-pointer shrink-0">
                <div
                  className="w-9 h-9 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                  style={{ backgroundColor: hex }}
                />
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => updateColor(color.path, hexToRgba(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>

              {/* Label + hex */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {color.label}
                </p>
                <p className="text-[10px] text-gray-400 font-mono uppercase">{hex}</p>
              </div>

              {/* Reset button */}
              <button
                onClick={() => resetColor(color.path)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-violet-500 transition-all"
                title="Reset"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
