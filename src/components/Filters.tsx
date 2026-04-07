"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

export interface FilterState {
  category: string;
  license: string;
  format: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "icons", label: "Icons" },
  { value: "illustrations", label: "Illustrations" },
  { value: "lottie", label: "Lottie Animations" },
  { value: "animated-icons", label: "Animated Icons" },
  { value: "stickers", label: "Stickers" },
  { value: "3d-assets", label: "3D Assets" },
];

const licenses = [
  { value: "", label: "All Licenses" },
  { value: "CC0", label: "CC0 (Public Domain)" },
  { value: "MIT", label: "MIT License" },
  { value: "Apache-2.0", label: "Apache 2.0" },
  { value: "CC-BY-4.0", label: "CC BY 4.0" },
];

const formats = [
  { value: "", label: "All Formats" },
  { value: "SVG", label: "SVG" },
  { value: "PNG", label: "PNG" },
  { value: "JSON", label: "JSON (Lottie)" },
  { value: "GLB", label: "GLB (3D)" },
  { value: "GIF", label: "GIF" },
];

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function Filters({ onFilterChange, activeFilters }: FiltersProps) {
  const hasFilters = activeFilters.category || activeFilters.license || activeFilters.format;

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ category: "", license: "", format: "" });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <FilterSelect
        label="Category"
        options={categories}
        value={activeFilters.category}
        onChange={(v) => updateFilter("category", v)}
      />
      <FilterSelect
        label="License"
        options={licenses}
        value={activeFilters.license}
        onChange={(v) => updateFilter("license", v)}
      />
      <FilterSelect
        label="Format"
        options={formats}
        value={activeFilters.format}
        onChange={(v) => updateFilter("format", v)}
      />
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
