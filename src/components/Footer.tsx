"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                OPENS
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Open-source design assets aggregator. Free, properly licensed, and
              ready to use.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              Categories
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              Licenses
            </h4>
            <ul className="space-y-2">
              {["CC0", "MIT", "Apache 2.0", "CC BY 4.0"].map((l) => (
                <li key={l}>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{l}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              About
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Open Source Project
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Contribute on GitHub
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 text-center">
          <p className="text-sm text-gray-400">
            OPENS - Open-Source Design Asset Aggregator
          </p>
        </div>
      </div>
    </footer>
  );
}
