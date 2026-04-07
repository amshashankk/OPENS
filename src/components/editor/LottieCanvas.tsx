"use client";

import { useRef, useEffect, useCallback } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { useEditorStore } from "@/store/useEditorStore";

export default function LottieCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const {
    animationJson, jsonVersion, bgColor, isPlaying, speed, loop, direction,
    setCurrentFrame, setPlaying, totalFrames,
  } = useEditorStore();

  // Load/reload animation when JSON changes
  useEffect(() => {
    if (!containerRef.current || !animationJson) return;

    // Destroy previous
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay: isPlaying,
      animationData: structuredClone(animationJson),
    });

    anim.setSpeed(speed);
    anim.setDirection(direction);

    anim.addEventListener("enterFrame", () => {
      setCurrentFrame(Math.floor(anim.currentFrame));
    });

    anim.addEventListener("complete", () => {
      if (!loop) setPlaying(false);
    });

    animRef.current = anim;

    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [jsonVersion, animationJson]);

  // Sync play/pause
  useEffect(() => {
    if (!animRef.current) return;
    if (isPlaying) animRef.current.play();
    else animRef.current.pause();
  }, [isPlaying]);

  // Sync speed
  useEffect(() => {
    if (animRef.current) animRef.current.setSpeed(speed);
  }, [speed]);

  // Sync loop
  useEffect(() => {
    if (animRef.current) animRef.current.loop = loop;
  }, [loop]);

  // Sync direction
  useEffect(() => {
    if (animRef.current) animRef.current.setDirection(direction);
  }, [direction]);

  // Scrub to frame (called from timeline)
  const scrubTo = useEditorStore((s) => s.currentFrame);
  const prevScrubRef = useRef(scrubTo);
  useEffect(() => {
    // Only scrub if the frame was set externally (not from enterFrame)
    if (animRef.current && !isPlaying && scrubTo !== prevScrubRef.current) {
      animRef.current.goToAndStop(scrubTo, true);
    }
    prevScrubRef.current = scrubTo;
  }, [scrubTo, isPlaying]);

  if (!animationJson) {
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
      <div
        className="relative rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        style={{ backgroundColor: bgColor, maxWidth: "100%", maxHeight: "100%" }}
      >
        <div
          ref={containerRef}
          style={{ width: Math.min(animationJson.w, 600), height: Math.min(animationJson.h, 600) }}
        />
      </div>
    </div>
  );
}
