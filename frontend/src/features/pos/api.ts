import { api } from "@/lib/api";
import type { Sale, Order, PaginatedResponse, SaleFilters } from "@/types";

export const saleApi = {
  getAll: async (filters?: SaleFilters): Promise<PaginatedResponse<Sale>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.paymentMethod) params.append("paymentMethod", filters.paymentMethod);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.search) params.append("search", filters.search);

    const response = await api.get(`/sales?${params.toString()}`);
    // Backend returns { sales, pagination } — map to { data, pagination }
    return { data: response.data.sales, pagination: response.data.pagination };
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data.sale;
  },

  create: async (data: { items: Array<{ productId: string; quantity: number }>; customerId?: string; discount?: number; taxRate?: number; receivedAmount?: number; paymentMethod?: string; customerName?: string; customerPhone?: string; notes?: string }): Promise<Sale> => {
    const response = await api.post("/sales", data);
    return response.data.sale;
  },

  cancel: async (id: string): Promise<Sale> => {
    const response = await api.put(`/sales/${id}/cancel`);
    return response.data.sale;
  },
};

export const orderApi = {
  getAll: async (params?: { page?: number; limit?: number; paymentMethod?: string; startDate?: string; endDate?: string; search?: string }): Promise<PaginatedResponse<Order>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.paymentMethod) searchParams.append("paymentMethod", params.paymentMethod);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.search) searchParams.append("search", params.search);

    const response = await api.get(`/orders?${searchParams.toString()}`);
    // Backend returns { orders, pagination } — map to { data, pagination }
    return { data: response.data.orders, pagination: response.data.pagination };
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  },

  create: async (data: { items: Array<{ productId: string; quantity: number }>; paymentMethod?: "CASH" | "CARD" | "ONLINE"; discount?: number; notes?: string }): Promise<Order> => {
    const response = await api.post("/orders", data);
    return response.data.order;
  },

  updateStatus: async (id: string, paymentMethod: "CASH" | "CARD" | "ONLINE"): Promise<Order> => {
    const response = await api.put(`/orders/${id}/status`, { paymentMethod });
    return response.data.order;
  },
};