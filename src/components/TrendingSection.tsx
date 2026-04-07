"use client";

import { useEffect, useState } from "react";
import AssetGrid from "./AssetGrid";
import { TrendingUp } from "lucide-react";

export default function TrendingSection() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assets?featured=true&limit=12")
      .then((r) => r.json())
      .then((data) => {
        setAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trending Assets
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Most popular this week
          </p>
        </div>
      </div>
      <AssetGrid assets={assets} loading={loading} />
    </section>
  );
}
