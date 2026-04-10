"use client";

import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import SearchSuggestions from "./SearchSuggestions";

const categoryOptions = [
  { value: "", label: "All Assets" },
  { value: "3d-assets", label: "3D Icons" },
  { value: "lottie", label: "Lottie Animations" },
  { value: "animated-icons", label: "Animated Icons" },
  { value: "illustrations", label: "Illustrations" },
  { value: "icons", label: "Icons" },
  { value: "stickers", label: "Stickers & Emojis" },
];

export default function HeroSection({ totalAssets }: { totalAssets: number }) {
  const { setSearchQuery: setGlobalSearch } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showCatDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownMenuRef.current?.contains(e.target as Node)) return;
      if (dropdownBtnRef.current?.contains(e.target as Node)) return;
      setShowCatDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCatDropdown]);

  const doSearch = (overrideCategory?: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
      setGlobalSearch(searchQuery.trim());
    }
    const cat = overrideCategory !== undefined ? overrideCategory : selectedCategory;
    if (cat) params.set("category", cat);
    router.push(`/search?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    doSearch();
  };

  const handleSuggestionSelect = useCallback((term: string) => {
    setSearchQuery(term);
    setGlobalSearch(term);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [router, setSearchQuery, setGlobalSearch]);

  const trending = [
    "Loading", "Business", "User Interface", "Arrow", "Heart",
    "Dashboard", "Social Media", "Notification", "Shopping", "Emoji",
  ];

  const selectedLabel = categoryOptions.find(c => c.value === selectedCategory)?.label || "All Assets";

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-sky-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950" />

      <div className="relative max-w-5xl mx-auto text-center px-4 pt-16 pb-20">
        {/* Main heading */}
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 dark:text-white leading-tight tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Over {totalAssets.toLocaleString("en-US")}+ Design Assets
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          The ultimate open-source marketplace for 3D Icons, Lottie Animations, Vector Illustrations & SVG Icons.
        </motion.p>
        <motion.p
          className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          All free, properly licensed — including Animated Icons, Stickers & Emojis.
        </motion.p>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSearch}
          className="mt-10 max-w-3xl mx-auto relative z-[100]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        >
          <div className="flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-none">
            {/* Category dropdown */}
            <div className="relative hidden sm:block">
              <button
                ref={dropdownBtnRef}
                type="button"
                onClick={() => {
                  if (!showCatDropdown && dropdownBtnRef.current) {
                    const rect = dropdownBtnRef.current.getBoundingClientRect();
                    setDropdownPos({ top: rect.bottom + 8, left: rect.left });
                  }
                  setShowCatDropdown(!showCatDropdown);
                }}
                className="flex items-center gap-2 px-6 py-4 text-[15px] font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap bg-gray-50/50 dark:bg-gray-800/50 rounded-l-full"
              >
                {selectedLabel}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCatDropdown ? "rotate-180" : ""}`} />
              </button>
              {showCatDropdown && (
                  <div
                    ref={dropdownMenuRef}
                    className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[999]"
                  >
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(opt.value); setShowCatDropdown(false); if (opt.value) doSearch(opt.value); }}
                        className={`w-full flex items-center justify-between px-5 py-3 text-[15px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedCategory === opt.value ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {opt.label}
                        {selectedCategory === opt.value && (
                          <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Search input */}
            <input
              type="text"
              placeholder={`Search from ${totalAssets.toLocaleString("en-US")} Design Assets`}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
              className="flex-1 px-5 py-4 text-sm sm:text-base bg-transparent focus:outline-none dark:text-white placeholder-gray-400 min-w-0"
            />

            {/* Search button */}
            <button
              type="submit"
              className="flex items-center justify-center w-12 h-12 mr-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <SearchSuggestions
            query={searchQuery}
            onSelect={handleSuggestionSelect}
            visible={showSuggestions}
            onClose={() => setShowSuggestions(false)}
          />
        </motion.form>

        {/* Trending tags */}
        <motion.div
          className="mt-5 flex items-center justify-center gap-x-2 gap-y-1 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="text-sm text-gray-400 font-medium">Trending:</span>
          {trending.map((term, i) => (
            <span key={term}>
              <button
                onClick={() => {
                  setSearchQuery(term);
                  setGlobalSearch(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {term}
              </button>
              {i < trending.length - 1 && <span className="text-gray-300 dark:text-gray-600 ml-1">,</span>}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
