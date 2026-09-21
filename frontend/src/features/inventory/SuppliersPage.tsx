import { useEffect, useState } from "react";
import { Plus, Truck, Edit, Trash2, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { supplierApi } from "./api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import type { Supplier } from "@/types";
import { toast } from "sonner";

interface SupplierFormData {
  company: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

const defaultFormData: SupplierFormData = {
  company: "",
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
};

export function SuppliersPage() {
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await supplierApi.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
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
      if (editingSupplier) {
        await supplierApi.update(editingSupplier.id, formData);
        toast.success("Supplier updated");
      } else {
        await supplierApi.create(formData);
        toast.success("Supplier created");
      }
      closeModals();
      fetchSuppliers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Operation failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      company: supplier.company || "",
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingSupplier(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      await supplierApi.delete(id);
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-500">Manage your product suppliers</p>
        </div>
        <Button onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Supplier
        </Button>
      </div>

      <Input label="Search suppliers" value={search} onChange={e=>setSearch(e.target.value)} />
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
                    <TableHead className="w-10">
                      <Building2 className="h-5 w-5 text-slate-400" strokeWidth={2} />
                    </TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Truck className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
                          <p>No suppliers yet</p>
                          <Button className="mt-4" size="sm" onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" strokeWidth={2} />
                            Add First Supplier
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.filter(s => `${s.name} ${s.company||""} ${s.phone||""}`.toLowerCase().includes(search.toLowerCase())).map((supplier) => (
                      <TableRow key={supplier.id} hover>
                        <TableCell className="text-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
                            <Truck className="h-5 w-5 text-blue-600" strokeWidth={2} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">{supplier.name}</p><p className="text-sm text-slate-500">{supplier.company}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600">{supplier.contactPerson || <span className="text-slate-400">—</span>}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-500">{supplier.email || <span className="text-slate-400">—</span>}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-500">{supplier.phone || <span className="text-slate-400">—</span>}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <button className="text-indigo-600 underline" onClick={async()=>{try{setDetail(await supplierApi.getById(supplier.id));}catch{toast.error("Unable to load supplied products");}}}>{supplier._count?.products || 0} products</button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(supplier)}
                              aria-label="Edit supplier"
                            >
                              <Edit className="h-4 w-4" strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(supplier.id)}
                              aria-label="Delete supplier"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" strokeWidth={2} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={closeModals}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              placeholder="Supplier name"
            />
            <Input label="Company" value={formData.company} onChange={e=>setFormData({...formData,company:e.target.value})} />
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Contact person name"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              placeholder="email@supplier.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+92 3XX XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Full address (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingSupplier ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detail} onClose={()=>setDetail(null)} title={`Products supplied by ${detail?.name || ""}`}><div className="space-y-3">{detail?.products?.map(p=><p key={p.id}>{p.name} - {p.sku} - {p.stockQuantity} in stock</p>)}{!detail?.products?.length&&<p>No products assigned to this supplier.</p>}</div></Modal>
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { handleDelete(deleteConfirmId!); setDeleteConfirmId(null); }}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? Products linked to this supplier will be unlinked."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}