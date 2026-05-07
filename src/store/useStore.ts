"use client";

import { create } from "zustand";

interface User {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatar: string | null;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  bookmarkedAssetIds: Set<string>;
  addBookmark: (assetId: string) => void;
  removeBookmark: (assetId: string) => void;
  setBookmarks: (ids: string[]) => void;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  bookmarkedAssetIds: new Set(),
  addBookmark: (assetId) =>
    set((s) => ({
      bookmarkedAssetIds: new Set([...s.bookmarkedAssetIds, assetId]),
    })),
  removeBookmark: (assetId) =>
    set((s) => {
      const next = new Set(s.bookmarkedAssetIds);
      next.delete(assetId);
      return { bookmarkedAssetIds: next };
    }),
  setBookmarks: (ids) => set({ bookmarkedAssetIds: new Set(ids) }),
  loginModalOpen: false,
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),
}));
