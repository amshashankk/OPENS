"use client";

import { Play, Pause, Repeat, ArrowRight, ArrowLeft } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

const speeds = [0.25, 0.5, 1, 1.5, 2];

export default function TimelineControls() {
  const {
    isPlaying, setPlaying, currentFrame, setCurrentFrame, totalFrames,
    speed, setSpeed, loop, setLoop, direction, toggleDirection,
  } = useEditorStore();

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    setCurrentFrame(parseInt(e.target.value));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={Math.max(totalFrames - 1, 1)}
        value={currentFrame}
        onChange={handleScrub}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-violet-500 cursor-pointer mb-3"
      />

      <div className="flex items-center justify-between gap-3">
        {/* Left: play controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleDirection}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={direction === 1 ? "Forward" : "Reverse"}
          >
            {direction === 1 ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setLoop(!loop)}
            className={`p-2 rounded-lg border transition-colors ${
              loop
                ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-600"
                : "border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            title="Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: frame counter */}
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums">
          {currentFrame} / {totalFrames}
        </div>

        {/* Right: speed */}
        <div className="flex items-center gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                speed === s
                  ? "bg-violet-500 text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
