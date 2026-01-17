"use client";

import { LucideIcon } from "lucide-react";

interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface SortOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortOptions: SortOption[];
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  sortOptions,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <section className="py-6 border-y border-white/10 bg-black/80 backdrop-blur-xl sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border ${
                    isActive
                      ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="flex-1 md:flex-none h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer appearance-none pr-10 relative font-bold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '0.8rem'
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
