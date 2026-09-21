import { useAuthStore } from "@/store/authStore";
import { exportExcel } from "@/features/business/exports";
import { handleApiError } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Search, Filter, Calendar, Eye, Download, CreditCard, Banknote, Smartphone, X } from "lucide-react";
import { saleApi } from "../pos/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import type { Sale } from "@/types";
import { toast } from "sonner";

export function SalesPage() {
  const canCancel = useAuthStore(s => s.user?.role !== "STAFF");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "COMPLETED" | "CANCELLED">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    fetchSales();
  }, [page, search, statusFilter, startDate, endDate, paymentFilter]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await saleApi.getAll({
        page,
        limit,
        search: search || undefined,
        paymentMethod: paymentFilter || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch sales");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const sale = await saleApi.getById(id);
      setSelectedSale(sale);
      setDetailModalId(id);
    } catch (error) {
      toast.error("Failed to load sale details");
    }
  };

  const exportCSV = () => {
    const headers = ["Invoice", "Date", "Customer", "Items", "Subtotal", "Discount", "Net Amount", "Status", "Payment", "Sold By"];
    const rows = sales.map(s => [
      s.invoiceNumber,
      formatRelativeTime(s.createdAt),
      s.customerName || "Walk-in",
      s.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
      formatCurrency(s.totalAmount),
      formatCurrency(s.discount),
      formatCurrency(s.netAmount),
      s.status,
      s.status === "COMPLETED" ? "Paid" : "N/A",
      s.user?.name || "Unknown",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: "COMPLETED" | "CANCELLED") => {
    const variants = {
      COMPLETED: "success" as const,
      CANCELLED: "danger" as const,
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case "CASH": return <Banknote className="h-4 w-4" strokeWidth={2} />;
      case "CARD": return <CreditCard className="h-4 w-4" strokeWidth={2} />;
      case "ONLINE": return <Smartphone className="h-4 w-4" strokeWidth={2} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500">View and manage all sales transactions</p>
        </div>
        <Button variant="outline" onClick={async()=>{try{const r=await saleApi.getAll({limit:10000,search,status:statusFilter==='all'?undefined:statusFilter,paymentMethod:paymentFilter||undefined,startDate:startDate||undefined,endDate:endDate||undefined});exportExcel('Sales',r.data.map(s=>({Invoice:s.invoiceNumber,Date:s.createdAt,Customer:s.customerName,Subtotal:s.totalAmount,Discount:s.discount,Tax:s.taxAmount,Total:s.netAmount,Payment:s.paymentMethod,Status:s.status})));}catch(e){toast.error(handleApiError(e));}}}>
          <Download className="h-4 w-4 mr-2" strokeWidth={2} />
          Export Excel
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search invoice, customer…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select label="Payment method" value={paymentFilter} onChange={e=>{setPaymentFilter(e.target.value);setPage(1);}} options={[{value:"",label:"All payments"},... ["CASH","CARD","ONLINE"].map(value=>({value,label:value}))]}/>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              options={[
                { value: "all", label: "All Status" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              className="w-full sm:w-40"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <label className="text-sm text-slate-600">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Sold By</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id} hover>
                        <TableCell>
                          <code className="font-mono text-sm text-slate-900">{sale.invoiceNumber}</code>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatRelativeTime(sale.createdAt)}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">{sale.customerName || "Walk-in Customer"}</p>
                          {sale.customerPhone && <p className="text-xs text-slate-500">{sale.customerPhone}</p>}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600">
                          -{formatCurrency(sale.discount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(sale.netAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(sale.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getPaymentIcon()}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {sale.user?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(sale.id)}
                              aria-label="View sale details"
                            >
                              <Eye className="h-4 w-4" strokeWidth={2} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!detailModalId}
        onClose={() => { setDetailModalId(null); setSelectedSale(null); }}
        title="Sale Details"
        size="xl"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Invoice Number</p>
                <p className="font-mono font-semibold text-lg">{selectedSale.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">{formatRelativeTime(selectedSale.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-medium">{getStatusBadge(selectedSale.status)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sold By</p>
                <p className="font-medium">{selectedSale.user?.name || "Unknown"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-medium">{selectedSale.customerName || "Walk-in Customer"}</p>
                {selectedSale.customerPhone && (
                  <p className="text-sm text-slate-500">{selectedSale.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500">Payment Method</p>
                <p className="font-medium flex items-center gap-1">
                  {getPaymentIcon()}
                  <span>{selectedSale.status === "COMPLETED" ? "Paid" : "N/A"}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-medium text-slate-900 mb-3">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product?.name || "Unknown Product"}</TableCell>
                      <TableCell><code className="text-sm text-slate-500">{item.product?.sku || "N/A"}</code></TableCell>
                      <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-slate-200 pt-4 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2"></div>
              <div className="space-y-2 text-right">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Discount</span>
                  <span className="font-medium tabular-nums">-{formatCurrency(selectedSale.discount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                  <span>Total incl. tax ({formatCurrency(selectedSale.taxAmount)})</span>
                  <span className="tabular-nums">{formatCurrency(selectedSale.netAmount)}</span>
                </div>
              </div>
            </div>

            {selectedSale.notes && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-slate-700">{selectedSale.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-slate-200">
              <a href={`/receipt/${selectedSale.id}`}><Button>Receipt / PDF</Button></a>
              {canCancel&&selectedSale.status==='COMPLETED'&&<Button variant="danger" disabled={cancelling} onClick={async()=>{if(!window.confirm('Cancel this sale and restore its stock?'))return;setCancelling(true);try{await saleApi.cancel(selectedSale.id);setDetailModalId(null);await fetchSales();toast.success('Sale cancelled and stock restored');}catch(e){toast.error(handleApiError(e));}finally{setCancelling(false);}}}>Cancel sale</Button>}

              <Button variant="outline" onClick={() => { setDetailModalId(null); setSelectedSale(null); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}