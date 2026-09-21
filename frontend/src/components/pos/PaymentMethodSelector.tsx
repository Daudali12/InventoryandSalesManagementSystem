import { Banknote, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePosStore } from "@/store/posStore";

const paymentMethods = [
  { id: "CASH" as const, label: "Cash", icon: Banknote, hotkey: "1" },
  { id: "CARD" as const, label: "Card", icon: CreditCard, hotkey: "2" },
  { id: "ONLINE" as const, label: "Online", icon: QrCode, hotkey: "3" },
] as const;

export function PaymentMethodSelector() {
  const { paymentMethod, setPaymentMethod } = usePosStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Payment Method
        </label>
        <span className="text-[11px] text-slate-400 font-medium">Quick Select</span>
      </div>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
        {paymentMethods.map((method) => {
          const isSelected = paymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethod(method.id)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-150 min-h-[58px] select-none",
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
              role="radio"
              aria-checked={isSelected}
              aria-label={method.label}
            >
              <method.icon
                className={cn("h-4 w-4 mb-1", isSelected ? "text-indigo-600" : "text-slate-500")}
                strokeWidth={2.2}
              />
              <span className="text-xs font-bold leading-tight">{method.label}</span>

              {/* Selection indicator pill */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}