"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { Eye, EyeOff, Layers, Box, Type, Image, Film, Circle } from "lucide-react";

const layerTypeInfo: Record<number, { label: string; Icon: React.ElementType }> = {
  0: { label: "Precomp", Icon: Film },
  1: { label: "Solid", Icon: Box },
  2: { label: "Image", Icon: Image },
  3: { label: "Null", Icon: Circle },
  4: { label: "Shape", Icon: Layers },
  5: { label: "Text", Icon: Type },
};

export default function LayerPanel() {
  const {
    animationJson, selectedLayerIndex, selectLayer,
    hiddenLayers, toggleLayerVisibility,
  } = useEditorStore();

  if (!animationJson) return null;

  const layers = animationJson.layers || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <Layers className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Layers</h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
          {layers.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.map((layer, i) => {
          const nm = (layer.nm as string) || `Layer ${i}`;
          const ty = (layer.ty as number) ?? 4;
          const info = layerTypeInfo[ty] || { label: "Unknown", Icon: Circle };
          const isSelected = selectedLayerIndex === i;
          const isHidden = hiddenLayers.has(i);

          return (
            <div
              key={i}
              onClick={() => selectLayer(isSelected ? null : i)}
              className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-l-2 transition-colors ${
                isSelected
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/10"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              {/* Type icon */}
              <info.Icon className={`w-3.5 h-3.5 shrink-0 ${isHidden ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${isHidden ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                  {nm}
                </p>
                <p className="text-[10px] text-gray-400">{info.label}</p>
              </div>

              {/* Visibility toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(i); }}
                className={`p-1 rounded transition-colors ${
                  isHidden
                    ? "text-gray-300 dark:text-gray-600 hover:text-gray-500"
                    : "text-gray-400 hover:text-violet-500"
                }`}
                title={isHidden ? "Show layer" : "Hide layer"}
              >
                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
