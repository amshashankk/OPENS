"use client";

import { useRef, useEffect, useCallback, memo } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { useEditorStore } from "@/store/useEditorStore";

function LottieCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const pendingReloadRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    animationJson, jsonVersion, bgColor, isPlaying, speed, loop, direction,
    setCurrentFrame, setPlaying, totalFrames,
  } = useEditorStore();

  // Load/reload animation when JSON changes — debounced to avoid rapid re-inits
  useEffect(() => {
    if (!containerRef.current || !animationJson) return;

    // Debounce reloads: wait 150ms before re-initializing
    if (pendingReloadRef.current) clearTimeout(pendingReloadRef.current);

    pendingReloadRef.current = setTimeout(() => {
      if (!containerRef.current) return;

      // Destroy previous
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }

      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "canvas", // canvas is faster than SVG for complex animations
        loop,
        autoplay: isPlaying,
        animationData: animationJson, // no clone needed — lottie-web doesn't mutate
      });

      anim.setSpeed(speed);
      anim.setDirection(direction);

      // Throttle enterFrame updates to ~15fps for the UI counter
      let lastFrameUpdate = 0;
      anim.addEventListener("enterFrame", () => {
        const now = performance.now();
        if (now - lastFrameUpdate > 66) { // ~15fps
          setCurrentFrame(Math.floor(anim.currentFrame));
          lastFrameUpdate = now;
        }
      });

      anim.addEventListener("complete", () => {
        if (!loop) setPlaying(false);
      });

      animRef.current = anim;
    }, 100);

    return () => {
      if (pendingReloadRef.current) clearTimeout(pendingReloadRef.current);
    };
  }, [jsonVersion, animationJson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

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

export default memo(LottieCanvas);
