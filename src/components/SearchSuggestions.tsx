"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Search, Box, Paintbrush, Play, Layers, Sparkles, Smile } from "lucide-react";

const categoryMeta: Record<string, { label: string; icon: typeof Box; color: string }> = {
  icons: { label: "Icons", icon: Layers, color: "text-emerald-500" },
  illustrations: { label: "Illustrations", icon: Paintbrush, color: "text-violet-500" },
  lottie: { label: "Lottie Animations", icon: Play, color: "text-amber-500" },
  "3d-assets": { label: "3D Assets", icon: Box, color: "text-blue-500" },
  "animated-icons": { label: "Animated Icons", icon: Sparkles, color: "text-sky-500" },
  stickers: { label: "Stickers", icon: Smile, color: "text-rose-500" },
};

interface GroupedResult {
  id: string;
  title: string;
  previewUrl: string;
  category: string;
}

interface SuggestionsData {
  suggestions: string[];
  grouped: Record<string, GroupedResult[]>;
}

export default function SearchSuggestions({
  query,
  onSelect,
  visible,
  onClose,
}: {
  query: string;
  onSelect: (term: string) => void;
  visible: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, onClose]);

  if (!visible || query.length < 2 || (!data && !loading)) return null;

  const hasGrouped = data && Object.keys(data.grouped).length > 0;

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
    >
      {loading && !data && (
        <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
      )}

      {/* Text suggestions */}
      {data?.suggestions && data.suggestions.length > 0 && (
        <div className="border-b border-gray-100 dark:border-gray-800">
          {data.suggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category-grouped previews */}
      {hasGrouped &&
        Object.entries(data!.grouped).map(([cat, items]) => {
          const meta = categoryMeta[cat];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={cat} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {meta.label}
                  </span>
                </div>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&category=${cat}`}
                  onClick={onClose}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-6 gap-2 px-4 pb-3">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/asset/${item.id}`}
                    onClick={onClose}
                    className="group"
                  >
                    <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center p-2 group-hover:border-violet-300 dark:group-hover:border-violet-600 transition-colors">
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 text-center mt-1 truncate">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

      {/* Search all link */}
      {data && (
        <button
          onClick={() => onSelect(query)}
          className="w-full px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-medium transition-colors text-left"
        >
          Search all results for &quot;{query}&quot;
        </button>
      )}
    </div>
  );
}
