import { useEffect, useState } from "react";
import { Plus, Tag, Edit, Trash2, Eye, Package } from "lucide-react";
import { categoryApi } from "./api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { cn } from "@/utils/cn";
import type { Category } from "@/types";
import { toast } from "sonner";

interface CategoryFormData {
  name: string;
  description: string;
}

const defaultFormData: CategoryFormData = {
  name: "",
  description: "",
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch categories");
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

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, formData);
        toast.success("Category updated");
      } else {
        await categoryApi.create(formData);
        toast.success("Category created");
      }
      closeModals();
      fetchCategories();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Operation failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      await categoryApi.delete(id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500">Organize products into categories</p>
        </div>
        <Button onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Category
        </Button>
      </div>

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
                      <Tag className="h-5 w-5 text-slate-400" strokeWidth={2} />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Tag className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
                          <p>No categories yet</p>
                          <Button className="mt-4" size="sm" onClick={() => { setFormData(defaultFormData); setIsCreateModalOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" strokeWidth={2} />
                            Create First Category
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell className="text-center">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                            <Tag className="h-5 w-5 text-primary" strokeWidth={2} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">{category.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {category.description || <span className="text-slate-400">No description</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="gray">{category._count?.products || 0} products</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(category)}
                              aria-label="Edit category"
                            >
                              <Edit className="h-4 w-4" strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(category.id)}
                              aria-label="Delete category"
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
        title={editingCategory ? "Edit Category" : "Add Category"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="Category name"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Category description (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { handleDelete(deleteConfirmId!); setDeleteConfirmId(null); }}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products in this category will be uncategorized."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}