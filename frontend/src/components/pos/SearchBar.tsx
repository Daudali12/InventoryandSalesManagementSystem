import { Search, X, Barcode, Command } from "lucide-react";
import { usePosStore } from "@/store/posStore";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  onScanBarcode?: () => void;
}

export function SearchBar({ onScanBarcode }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = usePosStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K focuses search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchQuery]);

  return (
    <div className="relative w-full">
      <label htmlFor="pos-search" className="sr-only">
        Search products by name, SKU or barcode
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          id="pos-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by title, SKU, or scan barcode..."
          className="w-full pl-10 pr-3 sm:pr-24 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:scale-95 transition-all"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {onScanBarcode && (
            <button
              type="button"
              onClick={onScanBarcode}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Barcode Scanner Ready"
              aria-label="Scan barcode"
            >
              <Barcode className="h-4 w-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-slate-500 border border-slate-200 shadow-2xs">
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>
    </div>
  );
}