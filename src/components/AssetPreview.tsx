"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LottiePreview = dynamic(() => import("./LottiePreview"), { ssr: false });

interface AssetPreviewProps {
  previewUrl: string;
  downloadUrl?: string;
  category: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AssetPreview({ previewUrl, downloadUrl, category, title, className, style }: AssetPreviewProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // If preview URL is a JSON file, use Lottie player directly
  if (previewUrl.endsWith(".json")) {
    return <LottiePreview url={previewUrl} className={className} style={style} />;
  }

  // For lottie category: if the GIF preview fails, fall back to Lottie player with download URL
  if (imgFailed && category === "lottie" && downloadUrl?.endsWith(".json")) {
    return <LottiePreview url={downloadUrl} className={className} style={style} />;
  }

  // For animated icons with SVG: use object tag for live animation
  if (category === "animated-icons" && previewUrl.endsWith(".svg")) {
    return (
      <object
        data={previewUrl}
        type="image/svg+xml"
        className={`pointer-events-none ${className || ""}`}
        style={style}
        aria-label={title}
      >
        <img src={previewUrl} alt={title} style={{ width: "100%", height: "100%" }} className="object-contain" />
      </object>
    );
  }

  // Default: regular image with error fallback
  return (
    <img
      src={previewUrl}
      alt={title}
      className={`object-contain ${className || ""}`}
      style={style}
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );
}
