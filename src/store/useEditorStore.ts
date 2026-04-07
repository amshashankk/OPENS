"use client";

import { create } from "zustand";
import { extractColors, applyColorChange, type ColorEntry } from "@/lib/lottieColors";

interface LottieJson {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm?: string;
  layers: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface EditorState {
  // Source
  animationJson: LottieJson | null;
  fileName: string;
  sourceAssetId: string | null;

  // Playback
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  speed: number;
  loop: boolean;
  direction: 1 | -1;

  // Editing
  selectedLayerIndex: number | null;
  hiddenLayers: Set<number>;
  colors: ColorEntry[];
  bgColor: string;

  // Properties
  dimensions: { w: number; h: number };
  frameRate: number;
  animationName: string;

  // JSON version counter — increments on every edit to trigger canvas reload
  jsonVersion: number;

  // Actions
  setAnimationJson: (json: LottieJson, fileName?: string, assetId?: string) => void;
  setPlaying: (v: boolean) => void;
  setCurrentFrame: (f: number) => void;
  setSpeed: (s: number) => void;
  setLoop: (v: boolean) => void;
  toggleDirection: () => void;
  selectLayer: (i: number | null) => void;
  toggleLayerVisibility: (i: number) => void;
  updateColor: (path: string, newColor: [number, number, number, number]) => void;
  setDimensions: (w: number, h: number) => void;
  setFrameRate: (fr: number) => void;
  setAnimationName: (name: string) => void;
  setBgColor: (hex: string) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  animationJson: null,
  fileName: "animation.json",
  sourceAssetId: null,
  isPlaying: true,
  currentFrame: 0,
  totalFrames: 0,
  speed: 1,
  loop: true,
  direction: 1,
  selectedLayerIndex: null,
  hiddenLayers: new Set(),
  colors: [],
  bgColor: "#ffffff",
  dimensions: { w: 512, h: 512 },
  frameRate: 30,
  animationName: "",
  jsonVersion: 0,

  setAnimationJson: (json, fileName, assetId) => {
    const colors = extractColors(json);
    set({
      animationJson: json,
      fileName: fileName || "animation.json",
      sourceAssetId: assetId || null,
      dimensions: { w: json.w, h: json.h },
      frameRate: json.fr,
      animationName: json.nm || "",
      totalFrames: json.op - json.ip,
      currentFrame: 0,
      isPlaying: true,
      colors,
      hiddenLayers: new Set(),
      selectedLayerIndex: null,
      jsonVersion: get().jsonVersion + 1,
    });
  },

  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentFrame: (f) => set({ currentFrame: f }),
  setSpeed: (s) => set({ speed: s }),
  setLoop: (v) => set({ loop: v }),
  toggleDirection: () => set((s) => ({ direction: s.direction === 1 ? -1 : 1 })),
  selectLayer: (i) => set({ selectedLayerIndex: i }),

  toggleLayerVisibility: (i) => {
    const { hiddenLayers, animationJson, jsonVersion } = get();
    const next = new Set(hiddenLayers);
    if (next.has(i)) next.delete(i);
    else next.add(i);

    // Also update the JSON layers[i].hd flag
    if (animationJson) {
      const clone = structuredClone(animationJson);
      if (clone.layers[i]) {
        clone.layers[i].hd = next.has(i);
      }
      set({ hiddenLayers: next, animationJson: clone, jsonVersion: jsonVersion + 1 });
    } else {
      set({ hiddenLayers: next });
    }
  },

  updateColor: (path, newColor) => {
    const { animationJson, colors, jsonVersion } = get();
    if (!animationJson) return;
    const newJson = applyColorChange(animationJson, path, newColor) as LottieJson;
    const newColors = colors.map((c) =>
      c.path === path ? { ...c, value: newColor } : c
    );
    set({ animationJson: newJson, colors: newColors, jsonVersion: jsonVersion + 1 });
  },

  setDimensions: (w, h) => {
    const { animationJson, jsonVersion } = get();
    if (!animationJson) return;
    const clone = structuredClone(animationJson);
    clone.w = w;
    clone.h = h;
    set({ animationJson: clone, dimensions: { w, h }, jsonVersion: jsonVersion + 1 });
  },

  setFrameRate: (fr) => {
    const { animationJson, jsonVersion } = get();
    if (!animationJson) return;
    const clone = structuredClone(animationJson);
    clone.fr = fr;
    set({ animationJson: clone, frameRate: fr, jsonVersion: jsonVersion + 1 });
  },

  setAnimationName: (name) => {
    const { animationJson, jsonVersion } = get();
    if (!animationJson) return;
    const clone = structuredClone(animationJson);
    clone.nm = name;
    set({ animationJson: clone, animationName: name, jsonVersion: jsonVersion + 1 });
  },

  setBgColor: (hex) => set({ bgColor: hex }),

  reset: () =>
    set({
      animationJson: null,
      fileName: "animation.json",
      sourceAssetId: null,
      isPlaying: true,
      currentFrame: 0,
      totalFrames: 0,
      speed: 1,
      loop: true,
      direction: 1,
      selectedLayerIndex: null,
      hiddenLayers: new Set(),
      colors: [],
      bgColor: "#ffffff",
      dimensions: { w: 512, h: 512 },
      frameRate: 30,
      animationName: "",
      jsonVersion: 0,
    }),
}));
