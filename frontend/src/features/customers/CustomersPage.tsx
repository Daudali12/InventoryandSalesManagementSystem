import { api, handleApiError } from "@/lib/api";
import { exportExcel } from "@/features/business/exports";
import type { Sale } from "@/types";
import { formatCurrency } from "@/utils/formatters";
import { useEffect, useState } from "react";
import { Search, Users, Plus, Edit2, Trash2, Download, Phone, Mail, MapPin } from "lucide-react";
import { customerApi } from "./api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { formatRelativeTime } from "@/utils/formatters";
import type { Customer } from "@/types";
import { toast } from "sonner";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const defaultFormData: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export function CustomersPage() {
  const [history, setHistory] = useState<{name:string;sales:Sale[];totalSpending:number}|null>(null);
  const openHistory = async (customer:Customer) => {try {const r=await api.get(`/customers/${customer.id}/history`);setHistory({name:customer.name,...r.data});}catch(e){toast.error(handleApiError(e));}};

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerApi.getAll({
        page,
        limit,
        search: search || undefined,
      });
      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch customers");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, formData);
        toast.success("Customer updated successfully");
      } else {
        await customerApi.create(formData);
        toast.success("Customer created successfully");
      }
      closeModals();
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to save customer");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      await customerApi.delete(id);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete customer");
      console.error(error);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Address", "Joined"];
    const rows = customers.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.address || "",
      formatRelativeTime(c.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500">Manage client directory and customer records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => { try { const r=await customerApi.getAll({limit:10000,search});exportExcel("Customers",r.data.map(c=>({Name:c.name,Email:c.email,Phone:c.phone,Address:c.address}))); } catch(e){toast.error(handleApiError(e));} }}>
            <Download className="h-4 w-4 mr-2" strokeWidth={2} />
            Export Excel
          </Button>
          <Button onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, email, phone or address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

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
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
                          <p className="font-medium">No customers found</p>
                          <Button className="mt-2" size="sm" onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" strokeWidth={2} />
                            Add First Customer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell className="text-center">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button className="font-semibold text-indigo-600 underline" onClick={() => openHistory(customer)}>{customer.name}</button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {!customer.phone && !customer.email && (
                              <span className="text-slate-400 italic">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.address ? (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-xs">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatRelativeTime(customer.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)} aria-label="Edit">
                              <Edit2 className="h-4 w-4 text-slate-600" strokeWidth={2} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(customer.id)} aria-label="Delete">
                              <Trash2 className="h-4 w-4 text-red-500" strokeWidth={2} />
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
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={closeModals}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="e.g. Ali Khan"
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            placeholder="ali@example.com"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+92 300 1234567"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Store or delivery address"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModals}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{editingCustomer ? "Save Changes" : "Create Customer"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!history} onClose={() => setHistory(null)} title={`Purchase history ? ${history?.name || ''}`} size="lg">{history&&<div className="space-y-4"><p className="font-bold">Total spending: {formatCurrency(history.totalSpending)}</p>{history.sales.map(s=><a key={s.id} href={`/receipt/${s.id}`} className="block border-t py-3 text-indigo-600">{s.invoiceNumber} ? {s.createdAt.slice(0,10)} ? {s.status} ? {formatCurrency(s.netAmount)}</a>)}{!history.sales.length&&<p>No purchases recorded for this customer.</p>}</div>}</Modal>
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This record will be permanently removed."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}