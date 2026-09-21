import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, AlertTriangle, ArrowUpDown, History, Download, RefreshCw } from "lucide-react";
import { productApi, categoryApi } from "./api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge, StockBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import type { Product, Category, StockMovement } from "@/types";
import { toast } from "sonner";

interface StockAdjustmentData {
  type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGED";
  quantity: number;
  reason: string;
}

export function InventoryPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "normal">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [adjustmentModalId, setAdjustmentModalId] = useState<string | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustmentData>({
    type: "IN",
    quantity: 1,
    reason: "",
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [movementHistoryId, setMovementHistoryId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Initialize stockFilter from URL query params (e.g. from Dashboard quick link)
  useEffect(() => {
    if (searchParams.get("lowStock") === "true") {
      setStockFilter("low");
    }
  }, [searchParams]);

  // Load categories for the filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getAll({
        page,
        limit,
        search: search.trim() || undefined,
        categoryId: categoryFilter || undefined,
        lowStock: stockFilter === "low",
        stock: stockFilter,
      });
      setProducts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || (response.data || []).length);
    } catch (error) {
      toast.error("Failed to fetch inventory products");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products locally for "out" and "normal" filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (stockFilter === "low") return p.stockQuantity <= p.lowStockThreshold;
      if (stockFilter === "out") return p.stockQuantity <= 0;
      if (stockFilter === "normal") return p.stockQuantity > p.lowStockThreshold;
      return true;
    });
  }, [products, stockFilter]);

  // Derived inventory stats
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity <= 0).length,
    [products]
  );
  const totalStockValue = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stockQuantity) || 0), 0),
    [products]
  );

  const openAdjustmentModal = (product: Product) => {
    setAdjustmentModalId(product.id);
    setAdjustmentData({ type: "IN", quantity: 1, reason: "" });
  };

  const openMovementHistory = async (productId: string) => {
    setMovementHistoryId(productId);
    setIsLoadingMovements(true);
    setMovements([]);
    try {
      const response = await productApi.getById(productId);
      setMovements(response?.stockMovements || []);
    } catch (error) {
      toast.error("Failed to load stock movement history");
      setMovements([]);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustmentModalId) return;

    if (adjustmentData.type !== "ADJUSTMENT" && adjustmentData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (adjustmentData.type === "OUT") {
      const product = products.find((p) => p.id === adjustmentModalId);
      if (product && product.stockQuantity < adjustmentData.quantity) {
        toast.error(`Insufficient stock. Current stock is ${product.stockQuantity}.`);
        return;
      }
    }

    setIsAdjusting(true);
    try {
      await productApi.adjustStock(adjustmentModalId, adjustmentData);
      toast.success("Stock adjusted successfully");
      setAdjustmentModalId(null);
      fetchProducts();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to adjust stock";
      toast.error(message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const exportCSV = () => {
    const headers = ["SKU", "Name", "Category", "Supplier", "Stock", "Threshold", "Price", "Cost", "Value"];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.name,
      p.category?.name || "",
      p.supplier?.name || "",
      p.stockQuantity.toString(),
      p.lowStockThreshold.toString(),
      formatCurrency(p.price),
      formatCurrency(p.costPrice),
      formatCurrency((Number(p.costPrice) || 0) * (Number(p.stockQuantity) || 0)),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedProduct = products.find((p) => p.id === adjustmentModalId);
  const historyProduct = products.find((p) => p.id === movementHistoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Monitor stock levels, adjustments, and movement logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalStockValue)}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-full sm:w-48"
            />

            <Select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as any);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Stock Status" },
                { value: "normal", label: "In Stock" },
                { value: "low", label: "Low Stock" },
                { value: "out", label: "Out of Stock" },
              ]}
              className="w-full sm:w-44"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Threshold</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-10 w-10 text-slate-300" />
                          <p className="font-medium">No inventory products found</p>
                          <p className="text-xs text-slate-400">Try adjusting your filters or search term</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const cost = Number(product.costPrice) || 0;
                      const qty = Number(product.stockQuantity) || 0;
                      const value = cost * qty;

                      return (
                        <TableRow key={product.id} hover>
                          <TableCell>
                            <p className="font-semibold text-slate-900">{product.name}</p>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {product.sku}
                            </code>
                          </TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="gray">{product.category.name}</Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.supplier ? (
                              <span className="text-sm text-slate-600">{product.supplier.name}</span>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold tabular-nums">
                            {qty}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm text-slate-500 tabular-nums">
                            {product.lowStockThreshold}
                          </TableCell>
                          <TableCell className="text-right text-slate-600 tabular-nums">
                            {formatCurrency(cost)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                            {formatCurrency(value)}
                          </TableCell>
                          <TableCell className="text-center">
                            <StockBadge quantity={qty} threshold={product.lowStockThreshold} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAdjustmentModal(product)}
                                className="gap-1 text-xs"
                              >
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                <span>Adjust</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openMovementHistory(product.id)}
                                title="Movement History"
                              >
                                <History className="h-4 w-4 text-slate-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustmentModalId}
        onClose={() => setAdjustmentModalId(null)}
        title="Adjust Stock Level"
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                <p className="text-xs text-slate-500 font-mono">SKU: {selectedProduct.sku}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Current Stock</span>
                <p className="text-lg font-bold text-slate-900">{selectedProduct.stockQuantity}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["IN", "OUT", "ADJUSTMENT", "DAMAGED"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAdjustmentData((d) => ({ ...d, type }))}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all cursor-pointer",
                      adjustmentData.type === type
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    )}
                  >
                    <div className="text-sm capitalize">{type.toLowerCase()}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {type === "IN" ? "Add (+)" : (type === "OUT" || type === "DAMAGED") ? "Reduce (-)" : "Set exact (=)"}
                    </div>
                  </button>
                ))}
              </div>

              <Input
                label={adjustmentData.type === "ADJUSTMENT" ? "New Total Count *" : "Quantity *"}
                type="number"
                min={adjustmentData.type === "ADJUSTMENT" ? "0" : "1"}
                value={adjustmentData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setAdjustmentData((d) => ({ ...d, quantity: isNaN(val) ? 0 : val }));
                }}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Notes</label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData((d) => ({ ...d, reason: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. New supplier shipment, inventory audit, damaged items"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setAdjustmentModalId(null)}>
                Cancel
              </Button>
              <Button onClick={handleAdjustment} isLoading={isAdjusting}>
                Apply Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Stock Movement History Modal */}
      <Modal
        isOpen={!!movementHistoryId}
        onClose={() => setMovementHistoryId(null)}
        title="Stock Movement Log"
        size="lg"
      >
        {historyProduct && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">{historyProduct.name}</p>
                <p className="text-xs text-slate-500 font-mono">SKU: {historyProduct.sku}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Current Stock</span>
                <p className="text-base font-bold text-slate-900">{historyProduct.stockQuantity}</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoadingMovements ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto" />
                </div>
              ) : movements.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No recorded movements for this item</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-36">Date</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      <TableHead className="text-right w-24">Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs text-slate-500">
                          {formatRelativeTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.type === "IN" ? "success" : m.type === "OUT" ? "danger" : "info"
                            }
                          >
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {m.type === "OUT" || m.type === "DAMAGED" ? `-${m.quantity}` : m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {m.reason || <span className="text-slate-400">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setMovementHistoryId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}