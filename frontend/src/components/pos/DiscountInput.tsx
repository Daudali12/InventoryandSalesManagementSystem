import { Percent, Tag } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePosStore } from "@/store/posStore";

export function DiscountInput() {
  const { discount, discountType, setDiscount } = usePosStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Discount
        </label>
        {/* Toggle Percentage vs Fixed */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setDiscount(discount, "percentage")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors",
              discountType === "percentage"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => setDiscount(discount, "fixed")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors",
              discountType === "fixed"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Fixed
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs font-bold">
          {discountType === "percentage" ? (
            <Percent className="h-3.5 w-3.5" />
          ) : (
            <Tag className="h-3.5 w-3.5" />
          )}
        </div>
        <input
          type="number"
          min="0"
          step={discountType === "percentage" ? "1" : "10"}
          value={discount || ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setDiscount(isNaN(val) ? 0 : val, discountType);
          }}
          placeholder={discountType === "percentage" ? "0 %" : "0.00"}
          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all"
        />
      </div>
    </div>
  );
}