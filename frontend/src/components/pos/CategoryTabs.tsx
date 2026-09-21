import { cn } from "@/utils/cn";
import type { Category } from "@/types";
import { LayoutGrid } from "lucide-react";

interface CategoryTabsProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  totalProductsCount?: number;
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
  totalProductsCount,
}: CategoryTabsProps) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none select-none"
      role="tablist"
      aria-label="Product categories"
    >
      {/* All Categories Tab */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 min-h-[36px]",
          activeCategoryId === null
            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        role="tab"
        aria-selected={activeCategoryId === null}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>All Items</span>
        {totalProductsCount !== undefined && (
          <span
            className={cn(
              "ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeCategoryId === null
                ? "bg-white/20 text-white"
                : "bg-slate-200/70 text-slate-600"
            )}
          >
            {totalProductsCount}
          </span>
        )}
      </button>

      {/* Category Pills */}
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        const count = category._count?.products;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 min-h-[36px]",
              isActive
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
            )}
            role="tab"
            aria-selected={isActive}
          >
            <span>{category.name}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/70 text-slate-600"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}