"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import AssetGrid from "@/components/AssetGrid";
import {
  Bookmark,
  Download,
  FolderOpen,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";

function ProfileContent() {
  const { user, setUser, setBookmarks } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "bookmarks";
  const [tab, setTab] = useState(initialTab);
  const [bookmarkedAssets, setBookmarkedAssets] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [collections, setCollections] = useState<
    { id: string; name: string; description: string | null; _count: { bookmarks: number } }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [newCollName, setNewCollName] = useState("");
  const [showNewColl, setShowNewColl] = useState(false);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setBio(user.bio || "");
    setName(user.name || "");
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [bRes, dRes, cRes] = await Promise.all([
      fetch("/api/bookmarks"),
      fetch("/api/downloads"),
      fetch("/api/collections"),
    ]);
    const [bData, dData, cData] = await Promise.all([
      bRes.json(),
      dRes.json(),
      cRes.json(),
    ]);

    const bookmarks = bData.bookmarks || [];
    setBookmarkedAssets(bookmarks.map((b: { asset: unknown }) => b.asset));
    setBookmarks(bookmarks.map((b: { assetId: string }) => b.assetId));
    setDownloads((dData.downloads || []).map((d: { asset: unknown }) => d.asset));
    setCollections(cData.collections || []);
    setLoading(false);
  };

  const createCollection = async () => {
    if (!newCollName.trim()) return;
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCollName }),
    });
    setNewCollName("");
    setShowNewColl(false);
    fetchData();
  };

  const deleteCollection = async (id: string) => {
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (!user) return null;

  const tabs = [
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "collections", label: "Collections", icon: FolderOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-bold">
          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user.name || "User"}
          </h1>
          <p className="text-gray-500">{user.email}</p>
          {user.bio && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.bio}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "bookmarks" && (
        <AssetGrid assets={bookmarkedAssets} loading={loading} />
      )}

      {tab === "downloads" && (
        <AssetGrid assets={downloads} loading={loading} />
      )}

      {tab === "collections" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Collections
            </h2>
            <button
              onClick={() => setShowNewColl(!showNewColl)}
              className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium"
            >
              <Plus className="w-4 h-4" /> New Collection
            </button>
          </div>

          {showNewColl && (
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                placeholder="Collection name..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button
                onClick={createCollection}
                className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600"
              >
                Create
              </button>
            </div>
          )}

          {collections.length === 0 && !loading ? (
            <p className="text-gray-500 text-center py-10">No collections yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{c.name}</h3>
                    <button
                      onClick={() => deleteCollection(c.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {c._count.bookmarks} assets
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <p className="text-sm text-gray-400">Profile editing coming soon in the next update.</p>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
