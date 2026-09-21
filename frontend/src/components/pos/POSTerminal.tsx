import { api, handleApiError } from "@/lib/api";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Zap,
  Grid,
  List,
  Trash2,
  Receipt,
  Keyboard,
  CheckCircle2,
  Banknote,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatters";
import { usePosStore } from "@/store/posStore";
import { productApi, categoryApi } from "@/features/inventory/api";
import { saleApi } from "@/features/pos/api";
import { ProductCard } from "./ProductCard";
import { CartItem } from "./CartItem";
import { CategoryTabs } from "./CategoryTabs";
import { SearchBar } from "./SearchBar";
import { CustomerSelector } from "./CustomerSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { DiscountInput } from "./DiscountInput";
import { POSSidebar } from "./POSSidebar";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import type { Product, Category, Sale } from "@/types";
import { toast } from "sonner";

// Tax rate: default 5% (VAT/GST standard)


export function POSTerminal() {
  const [TAX_RATE, setTaxRate] = useState(0);
  const [settingsReady, setSettingsReady] = useState(false);
  useEffect(() => { api.get("/settings").then(r => { setTaxRate(r.data.taxRate); localStorage.setItem("store-currency", r.data.currency); setSettingsReady(true); }).catch(() => toast.error("Unable to load checkout settings. Reload to try again.")); }, []);
  const {
    cart,
    discount,
    discountType,
    customerId,
    customerName,
    customerPhone,
    notes,
    paymentMethod,
    receivedAmount,
    searchQuery,
    selectedCategoryId,
    addToCart,
    setSelectedCategory,
    setNotes,
    setPaymentMethod,
    setReceivedAmount,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getChange,
    getItemCount,
  } = usePosStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showLastSale, setShowLastSale] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const cartListEndRef = useRef<HTMLDivElement>(null);

  // Load Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Load Products
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await productApi.getAll({ limit: 500 });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q);

      const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount(TAX_RATE);
  const total = getTotal(TAX_RATE);
  const change = paymentMethod === "CASH" ? Math.max(0, receivedAmount - total) : 0;
  const itemCount = getItemCount();

  // Scroll to new cart items automatically
  useEffect(() => {
    if (cart.length > 0) {
      cartListEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [cart.length]);

  // Complete Order
  const handleCheckout = async () => {
    if (isProcessing || !settingsReady) return;
    if (cart.length === 0) {
      toast.error("Cart is empty! Add products to proceed.");
      return;
    }

    if (paymentMethod === "CASH" && receivedAmount < total) {
      toast.error(`Received amount (${formatCurrency(receivedAmount)}) is less than total (${formatCurrency(total)})`);
      return;
    }

    setIsProcessing(true);
    try {
      const sale = await saleApi.create({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerId, discount: discountAmount, taxRate: TAX_RATE, paymentMethod, receivedAmount,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      });

      setLastSale(sale);
      setShowLastSale(true);
      clearCart();
      await fetchProducts();
      toast.success(`Order Completed: ${sale.invoiceNumber}`, {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
    } catch (error: unknown) {
      const message = handleApiError(error);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard Shortcuts: F2 -> Complete Order, Esc -> Clear Cart/Cancel, Ctrl+/ -> Shortcuts Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0 && !isProcessing) {
          handleCheckout();
        }
      } else if (e.key === "Escape") {
        if (showLastSale) {
          setShowLastSale(false);
        } else if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (cart.length > 0) {
          setShowClearConfirm(true);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, isProcessing, showLastSale, showShortcutsModal, total, paymentMethod, receivedAmount]);

  const handlePrintReceipt = () => {
    if (lastSale) {
      window.open(`/receipt/${lastSale.id}`, "_blank");
    }
  };

  return (
    <div className="h-screen w-screen overflow-auto md:overflow-hidden flex flex-col md:flex-row bg-slate-100 font-sans text-slate-900 select-none">
      {/* ─────────────────────────────────────────────────────────────
          COLUMN 1: NAVIGATION SIDEBAR (Width: 80px)
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block"><POSSidebar /></div>
      <a href="/dashboard" className="md:hidden p-2 text-indigo-600">Back to dashboard</a>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 2: PRODUCT CATALOG & MAIN WORKSPACE (Flex-1)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-none md:flex-1 flex flex-col min-w-0 bg-[#F8FAFC] border-r border-slate-200/90 h-[55vh] min-h-[420px] md:min-h-0 md:h-full overflow-hidden">
        {/* Header Bar: Search, View Switcher & Actions */}
        <header className="px-6 py-3.5 bg-white border-b border-slate-200/90 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Search Bar with Ctrl+K Hint */}
          <div className="flex-1 max-w-xl">
            <SearchBar />
          </div>

          {/* Right Controls: View Switcher, Refresh, Shortcuts Help */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Switcher: Grid vs List */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Grid View"
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="List View"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh Products Button */}
            <button
              type="button"
              onClick={fetchProducts}
              className="p-2.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all shadow-2xs"
              title="Refresh Products"
              aria-label="Refresh products"
            >
              <RefreshCw className={cn("h-4 w-4", isLoadingProducts && "animate-spin text-indigo-600")} />
            </button>

            {/* Keyboard Shortcuts Dialog Trigger */}
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs transition-all"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="h-3.5 w-3.5 text-slate-400" />
              <span>Keys</span>
            </button>
          </div>
        </header>

        {/* Quick Category Tabs Strip */}
        <div className="px-6 py-2.5 bg-white/70 backdrop-blur-xs border-b border-slate-200/80 flex items-center justify-between gap-3 flex-shrink-0">
          <CategoryTabs
            categories={categories}
            activeCategoryId={selectedCategoryId}
            onSelect={setSelectedCategory}
            totalProductsCount={products.length}
          />
        </div>

        {/* Products Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {isLoadingProducts ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "grid-cols-1"
              )}
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-pulse bg-slate-200/60 rounded-xl",
                    viewMode === "grid" ? "h-64" : "h-16"
                  )}
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3 shadow-sm">
                <ShoppingBag className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? `No items match "${searchQuery}". Clear your search query or pick a different category.`
                  : "There are no products listed in this category yet."}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "grid-cols-1"
              )}
            >
              {filteredProducts.map((product) => {
                const cartEntry = cart.find((i) => i.product.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    isSelected={Boolean(cartEntry)}
                    onClick={() => {
                      // Handled inside ProductCard with micro-feedback
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Catalog Status Footer Bar */}
        <footer className="px-6 py-2 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{filteredProducts.length}</span> products available
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{categories.length}</span> categories
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Tap product or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">+</kbd> to add</span>
          </div>
        </footer>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          COLUMN 3: CHECKOUT & CART PANEL (Fixed Right: 400px)
      ───────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-[360px] xl:w-[410px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-auto min-h-[50vh] md:h-full shadow-lg z-10">
        {/* Cart Header: Customer Selector & Clear Cart */}
        <header className="p-4 border-b border-slate-200/90 bg-white flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Current Order</h2>
              {itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                  {itemCount}
                </span>
              )}
            </div>

            {/* Clear Cart Button */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
                title="Clear current cart (Esc)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
                <kbd className="hidden sm:inline text-[9px] px-1 bg-red-100/70 rounded text-red-700 font-mono">
                  Esc
                </kbd>
              </button>
            )}
          </div>

          {/* Customer Selector Dropdown */}
          <CustomerSelector />
        </header>

        {/* Cart Items List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs mb-3">
                <ShoppingBag className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-slate-700">Order is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Click on any product card from the catalog to add items
              </p>
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 shadow-2xs">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700">
                  Ctrl + K
                </kbd>
                <span>to search</span>
              </div>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <CartItem key={item.product.id} product={item.product} quantity={item.quantity} />
              ))}
              <div ref={cartListEndRef} />
            </>
          )}
        </div>

        {/* Payment Summary & Sticky Action Panel */}
        <section className="border-t border-slate-200 bg-white p-4 space-y-3.5 flex-shrink-0 shadow-xs">
          {/* Quick Pay / Payment Method */}
          <PaymentMethodSelector />

          {/* Discount & Received Amount Input Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <DiscountInput />

            {/* Quick Cash input if Cash is selected */}
            {paymentMethod === "CASH" ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Cash Given
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    PKR
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={receivedAmount || ""}
                    onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                    placeholder={total > 0 ? String(Math.ceil(total)) : "0"}
                    className="w-full pl-10 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Reference / Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order note (opt)"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Pricing Ledger Breakdown */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal ({itemCount} items)</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>
                  Discount (
                  {discountType === "percentage" ? `${discount}%` : formatCurrency(discount)})
                </span>
                <span className="font-semibold tabular-nums">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <span>Tax (VAT/GST {TAX_RATE}%)</span>
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(taxAmount)}
              </span>
            </div>

            {paymentMethod === "CASH" && receivedAmount > 0 && (
              <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200/60 font-medium">
                <span>Change Return</span>
                <span className="font-bold tabular-nums">{formatCurrency(change)}</span>
              </div>
            )}

            {/* Total Payable (Large font, bold weight, distinct accent) */}
            <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 font-bold">
              <span className="text-sm uppercase tracking-wide text-slate-800">Total Payable</span>
              <span className="text-2xl font-extrabold text-indigo-700 tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Main Primary Action Button (Complete Order / Pay Now F2) */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={cn(
              "w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-base transition-all duration-150 min-h-[48px] shadow-md select-none",
              cart.length === 0 || isProcessing
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-indigo-600/30 hover:shadow-indigo-600/40"
            )}
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" strokeWidth={2.2} />
              <span>{isProcessing ? "Processing..." : "Complete Order"}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tabular-nums">
                {formatCurrency(total)}
              </span>
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-mono font-semibold">
                F2
              </kbd>
            </div>
          </button>
        </section>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MODALS & OVERLAYS
      ───────────────────────────────────────────────────────────── */}
      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
          toast.success("Cart cleared");
        }}
        title="Clear Current Order?"
        message="Are you sure you want to remove all items from the active cart? This action cannot be undone."
        confirmText="Clear Cart"
        variant="danger"
      />

      {/* Sale Successful Modal */}
      {showLastSale && lastSale && (
        <Modal
          isOpen={showLastSale}
          onClose={() => setShowLastSale(false)}
          title="Payment Completed"
          size="md"
        >
          <div className="p-4 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce duration-700">
              <CheckCircle2 className="h-9 w-9" strokeWidth={2.2} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Sale Processed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Invoice Number:{" "}
                <span className="font-mono font-bold text-slate-800">{lastSale.invoiceNumber}</span>
              </p>
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total Received</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(lastSale.netAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode</span>
                <span className="font-semibold text-slate-800 uppercase">{paymentMethod}</span>
              </div>
              {lastSale.customerName && (
                <div className="flex justify-between text-slate-600">
                  <span>Customer</span>
                  <span className="font-semibold text-slate-800">{lastSale.customerName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowLastSale(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md shadow-indigo-600/30"
              >
                New Order
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (
        <Modal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
          title="POS Keyboard Shortcuts"
          size="md"
        >
          <div className="p-4 space-y-3 text-sm">
            <p className="text-xs text-slate-500">
              Operate the POS terminal rapidly using hotkeys without touching the mouse:
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-700">Focus Product Search</span>
                <kbd className="px-2 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-xs shadow-2xs">
                  Ctrl + K / ⌘K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-700">Complete Order &amp; Pay</span>
                <kbd className="px-2 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-xs shadow-2xs">
                  F2
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-700">Clear Search / Dismiss / Clear Cart</span>
                <kbd className="px-2 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-xs shadow-2xs">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-700">Open Hotkeys Guide</span>
                <kbd className="px-2 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-xs shadow-2xs">
                  Ctrl + /
                </kbd>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}