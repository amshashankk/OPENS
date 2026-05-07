"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const LIKED_KEY = "opens-liked";

export default function LikeButton() {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLiked(localStorage.getItem(LIKED_KEY) === "1");
    }
    fetch("/api/likes")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  const handleClick = async () => {
    if (liked) return;
    setLiked(true);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 600);
    if (typeof window !== "undefined") localStorage.setItem(LIKED_KEY, "1");
    setCount((c) => (c ?? 0) + 1);
    try {
      const res = await fetch("/api/likes", { method: "POST" });
      const d = await res.json();
      if (typeof d.count === "number") setCount(d.count);
    } catch {
      /* keep optimistic count */
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={liked}
      aria-label={liked ? "You liked this site" : "Like this site"}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 disabled:cursor-default transition-colors"
    >
      <Heart
        className={`w-4 h-4 transition-transform ${liked ? "fill-current" : ""} ${pulsing ? "scale-125" : ""}`}
      />
      <span className="text-sm font-medium tabular-nums">
        {count === null ? "—" : count.toLocaleString()}
      </span>
    </button>
  );
}
