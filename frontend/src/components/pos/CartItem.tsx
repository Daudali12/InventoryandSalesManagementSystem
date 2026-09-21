import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { usePosStore } from "@/store/posStore";
import type { Product } from "@/types";

interface CartItemProps {
  product: Product;
  quantity: number;
}

export function CartItem({ product, quantity }: CartItemProps) {
  const { updateQuantity, removeFromCart } = usePosStore();
  const lineTotal = product.price * quantity;

  return (
    <div className="group relative flex items-start gap-3 p-3 bg-white hover:bg-slate-50/70 border border-slate-200/80 rounded-xl transition-all duration-150 shadow-2xs">
      {/* Product initial avatar / badge */}
      <div className="w-11 h-11 flex-shrink-0 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
        <span className="text-indigo-700 font-bold text-sm">
          {product.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Name and Delete Button */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate leading-snug" title={product.name}>
              {product.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-medium">
                {formatCurrency(product.price)} each
              </span>
              {product.sku && (
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                  {product.sku}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeFromCart(product.id)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all flex-shrink-0"
            aria-label={`Remove ${product.name} from cart`}
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Quantity Controls & Line Subtotal */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Stepper buttons (min 44px touch-friendly target via padding/wrapper) */}
          <div className="inline-flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 rounded-md bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 flex items-center justify-center shadow-2xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <span className="w-9 text-center text-sm font-bold text-slate-900 tabular-nums">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="w-8 h-8 rounded-md bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 flex items-center justify-center shadow-2xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={quantity >= product.stockQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatCurrency(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}