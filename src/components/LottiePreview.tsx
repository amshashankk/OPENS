"use client";

import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";

export default function LottiePreview({ url, className, style }: { url: string; className?: string; style?: React.CSSProperties }) {
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only load when visible in viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
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
  }, [url, isVisible]);

  if (error) {
    return (
      <div ref={containerRef} className={className} style={style}>
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <rect width="100" height="100" rx="16" fill="currentColor" fillOpacity="0.1" />
          <path d="M35 30 L70 50 L35 70Z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>
    );
  }

  if (!data) {
    return (
      <div ref={containerRef} className={className} style={style}>
        {isVisible ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={style}>
      <Lottie animationData={data} loop autoplay style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
