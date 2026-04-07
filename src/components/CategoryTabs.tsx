"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const tabs = [
  { label: "All Assets", href: "/search", category: "" },
  { label: "3D Icons", href: "/search?category=3d-assets", category: "3d-assets" },
  { label: "Lottie Animations", href: "/search?category=lottie", category: "lottie" },
  { label: "Illustrations", href: "/search?category=illustrations", category: "illustrations" },
  { label: "Icons", href: "/search?category=icons", category: "icons" },
  { label: "Animated Icons", href: "/search?category=animated-icons", category: "animated-icons" },
  { label: "Stickers", href: "/search?category=stickers", category: "stickers" },
];

function TabsInner({ activeCategory }: { activeCategory: string }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      {tabs.map((tab) => {
        const isActive = activeCategory === tab.category;
        return (
          <Link
            key={tab.category}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "text-gray-900 dark:text-white font-bold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function CategoryTabs({ activeCategory }: { activeCategory: string }) {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <TabsInner activeCategory={activeCategory} />
    </Suspense>
  );
}
