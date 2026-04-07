"use client";

export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-12" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-8" />
        </div>
      </div>
    </div>
  );
}
