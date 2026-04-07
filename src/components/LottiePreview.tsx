"use client";

import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";

export default function LottiePreview({ url, className, style }: { url: string; className?: string; style?: React.CSSProperties }) {
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json) => {
        if (!cancelled && json.v !== undefined) setData(json);
        else if (!cancelled) setError(true);
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [url]);

  if (error || !data) {
    return (
      <div className={className} style={style}>
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <rect width="100" height="100" rx="16" fill="currentColor" fillOpacity="0.1" />
          <path d="M35 30 L70 50 L35 70Z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Lottie animationData={data} loop autoplay style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
