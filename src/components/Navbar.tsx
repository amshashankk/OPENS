"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Bookmark,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState, useEffect, useRef, useCallback } from "react";
import SearchSuggestions from "./SearchSuggestions";

export default function Navbar() {
  const { user, setUser, darkMode, toggleDarkMode } = useStore();
  const [navSearchQuery, setNavSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [setUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (navSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(navSearchQuery.trim())}`);
    }
  };

  const handleSuggestionSelect = useCallback((term: string) => {
    setNavSearchQuery(term);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { href: "/category/3d-assets", label: "3D Icons" },
    { href: "/category/lottie", label: "Lottie Animations" },
    { href: "/category/illustrations", label: "Illustrations" },
    { href: "/category/icons", label: "Icons" },
    { href: "/lottie-editor", label: "Lottie Editor" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent hidden sm:block">
              OPENS
            </span>
          </Link>

          {/* Category links - Desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search icons, illustrations, 3D assets..."
                value={navSearchQuery}
                onChange={(e) => { setNavSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => { if (navSearchQuery.length >= 2) setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all dark:text-white"
              />
              <SearchSuggestions
                query={navSearchQuery}
                onSelect={handleSuggestionSelect}
                visible={showSuggestions}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 dark:text-gray-300" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

          </div>
        </div>

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 dark:text-white"
              />
            </div>
          </form>
        )}
      </div>
    </nav>
  );
}
