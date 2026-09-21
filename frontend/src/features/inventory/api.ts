import { api } from "@/lib/api";
import type { Product, Category, Supplier, PaginatedResponse, ProductFilters, StockMovement } from "@/types";

export const productApi = {
  getAll: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);
    if (filters?.supplierId) params.append("supplierId", filters.supplierId);
    if (filters?.stock) params.append("stock", filters.stock);
    if (filters?.lowStock) params.append("lowStock", "true");

    const response = await api.get(`/products?${params.toString()}`);
    // Backend returns { products, pagination } — map to { data, pagination }
    return { data: response.data.products, pagination: response.data.pagination };
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post("/products", data);
    return response.data.product;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data.product;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  adjustStock: async (productId: string, data: { type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGED"; quantity: number; reason?: string }): Promise<{ product: Product; stockMovement: StockMovement }> => {
    const response = await api.post(`/products/${productId}/stock`, data);
    return response.data;
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get("/products/low-stock");
    return response.data.products;
  },
};

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data.categories;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.category;
  },

  create: async (data: { name: string; description?: string }): Promise<Category> => {
    const response = await api.post("/categories", data);
    return response.data.category;
  },

  update: async (id: string, data: { name?: string; description?: string }): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.category;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export const supplierApi = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get("/suppliers");
    return response.data.suppliers;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.supplier;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post("/suppliers", data);
    return response.data.supplier;
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.supplier;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};