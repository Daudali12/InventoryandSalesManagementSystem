import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Package,
  Tag,
  Truck,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";
import { productApi, categoryApi, supplierApi } from "./api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge, StockBadge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { formatCurrency } from "@/utils/formatters";
import { formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import type { Product, Category, Supplier, PaginatedResponse } from "@/types";
import { toast } from "sonner";

interface ProductFormData {
  imageUrl: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string;
  supplierId: string;
}

const defaultFormData: ProductFormData = {
  imageUrl: "",
  name: "",
  sku: "",
  description: "",
  price: 0,
  costPrice: 0,
  stockQuantity: 0,
  lowStockThreshold: 10,
  categoryId: "",
  supplierId: "",
};

export function ProductsPage() {
  const canEdit = useAuthStore(s => s.user?.role === "ADMIN");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/settings").then(r => { defaultFormData.lowStockThreshold = r.data.lowStockThreshold; }).catch(() => {});
    fetchCategories();
    fetchSuppliers();
    if (searchParams.get("action") === "new") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter, supplierFilter, lowStockFilter]);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await supplierApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getAll({
        page,
        limit,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        supplierId: supplierFilter || undefined,
        lowStock: lowStockFilter,
      });
      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch products");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.price || formData.price < 0) newErrors.price = "Valid price required";
    if (!formData.costPrice || formData.costPrice < 0) newErrors.costPrice = "Valid cost price required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, formData);
        toast.success("Product updated");
      } else {
        await productApi.create(formData);
        toast.success("Product created");
      }
      closeModals();
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Operation failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      imageUrl: product.imageUrl || "",      name: product.name,
      sku: product.sku,
      description: product.description || "",
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      categoryId: product.categoryId || "",
      supplierId: product.supplierId || "",
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      await productApi.delete(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500">Manage your product catalog</p>
        </div>
        <Button disabled={!canEdit} onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search products, SKU…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              options={[{ value: "", label: "All Categories" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              className="w-full sm:w-48"
            />
            <Select
              value={supplierFilter}
              onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
              options={[{ value: "", label: "All Suppliers" }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
              className="w-full sm:w-48"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              Low Stock Only
            </label>
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
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-slate-500 font-mono">{product.sku}</code>
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
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-right text-slate-500 tabular-nums">
                          {formatCurrency(product.costPrice)}
                        </TableCell>
                        <TableCell className="text-center font-mono font-medium tabular-nums">
                          {product.stockQuantity}
                        </TableCell>
                        <TableCell className="text-center">
                          <StockBadge quantity={product.stockQuantity} threshold={product.lowStockThreshold} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/products/${product.id}`)}
                              aria-label="View product"
                            >
                              <Eye className="h-4 w-4" strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canEdit} onClick={() => openEditModal(product)}
                              aria-label="Edit product"
                            >
                              <Edit className="h-4 w-4" strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canEdit} onClick={() => setDeleteConfirmId(product.id)}
                              aria-label="Delete product"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" strokeWidth={2} />
                    </Button>
                    <span className="text-sm text-slate-600 w-20 text-center">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronDown className="h-4 w-4" strokeWidth={2} />
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
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2"><Input label="Product image URL" value={formData.imageUrl} onChange={e => setFormData({...formData,imageUrl:e.target.value})}/><label className="block text-sm">Or upload image (PNG, JPEG, WebP; up to 500 KB)<input type="file" accept="image/png,image/jpeg,image/webp" className="block mt-2" onChange={e => { const file=e.target.files?.[0]; if(!file)return; if(file.size>500000){toast.error('Choose an image smaller than 500 KB');return;}const reader=new FileReader();reader.onload=()=>setFormData(current=>({...current,imageUrl:String(reader.result)}));reader.readAsDataURL(file); }}/></label>{formData.imageUrl&&<img src={formData.imageUrl} alt="Product preview" className="h-24 w-24 object-contain rounded border"/>}</div>
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              placeholder="Product name"
            />
            <Input
              label="SKU *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              error={formErrors.sku}
              placeholder="Unique SKU"
            />
            <Select
              label="Category *"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              error={formErrors.categoryId}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Select
              label="Supplier"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              options={[{ value: "", label: "None" }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
              placeholder="Select supplier"
            />
            <Input
              label="Price (PKR) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.price.toString()}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              error={formErrors.price}
              placeholder="0.00"
            />
            <Input
              label="Cost Price (PKR) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice.toString()}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              error={formErrors.costPrice}
              placeholder="0.00"
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Product description (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { handleDelete(deleteConfirmId!); setDeleteConfirmId(null); }}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}