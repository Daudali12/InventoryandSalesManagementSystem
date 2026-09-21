import { Package, AlertTriangle, Plus, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatters";
import { usePosStore } from "@/store/posStore";
import type { Product } from "@/types";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  viewMode?: "grid" | "list";
  onClick?: () => void;
}

export function ProductCard({ product, isSelected, viewMode = "grid", onClick }: ProductCardProps) {
  const addToCart = usePosStore((state) => state.addToCart);
  const [justAdded, setJustAdded] = useState(false);

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
    if (onClick) onClick();
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={() => !isOutOfStock && handleAdd()}
        className={cn(
          "group flex items-center justify-between p-3.5 bg-white rounded-xl border transition-all duration-150 cursor-pointer min-h-[56px] select-none",
          isSelected
            ? "border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500/20"
            : "border-slate-200 hover:border-indigo-400 hover:shadow-md",
          isOutOfStock && "opacity-50 cursor-not-allowed bg-slate-50/60"
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
          <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/80">
            <span className="font-bold text-slate-700 text-base">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-contain"/> : product.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>
              {product.category && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 flex-shrink-0">
                  {product.category.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="font-mono text-slate-400">{product.sku || "NO-SKU"}</span>
              <span className="text-slate-300">•</span>
              <span
                className={cn(
                  "font-medium",
                  isOutOfStock ? "text-red-600 font-semibold" : isLowStock ? "text-amber-600 font-semibold" : "text-slate-600"
                )}
              >
                {isOutOfStock ? "Out of stock" : `${product.stockQuantity} in stock`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95",
              justAdded
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : isOutOfStock
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
            )}
            aria-label={`Add ${product.name} to cart`}
          >
            {justAdded ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !isOutOfStock && handleAdd()}
      className={cn(
        "group relative flex flex-col bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden select-none",
        isSelected
          ? "border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
          : "border-slate-200/90 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5",
        isOutOfStock && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none bg-slate-50/50"
      )}
    >
      {/* Product Image Preview Header */}
      <div className="relative h-32 w-full bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex items-center justify-center border-b border-slate-100 overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200/70 flex items-center justify-center text-xl font-bold text-indigo-600 group-hover:scale-110 transition-transform duration-300">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-contain"/> : product.name.charAt(0).toUpperCase()}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs">
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
              {product.stockQuantity} left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/90 backdrop-blur-xs text-slate-700 border border-slate-200/70 shadow-xs">
              {product.stockQuantity} in stock
            </span>
          )}
        </div>

        {/* Quick Add Floating Action Button on Hover */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={cn(
            "absolute bottom-2.5 right-2.5 w-11 h-11 rounded-xl shadow-md flex items-center justify-center transition-all duration-200 active:scale-90",
            justAdded
              ? "bg-emerald-600 text-white scale-100 opacity-100 ring-2 ring-emerald-400"
              : isOutOfStock
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100 bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
          )}
          aria-label={`Quick add ${product.name}`}
        >
          {justAdded ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
        </button>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-mono font-medium text-slate-600 uppercase tracking-wider truncate">
              {product.sku || "SKU-AUTO"}
            </span>
            {product.category && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[100px]">
                {product.category.name}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={product.name}>
            {product.name}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Price</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50",
              justAdded && "text-emerald-600 bg-emerald-50"
            )}
          >
            {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}