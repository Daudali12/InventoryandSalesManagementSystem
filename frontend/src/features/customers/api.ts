import { api } from "@/lib/api";
import type { Customer, PaginatedResponse } from "@/types";

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const customerApi = {
  getAll: async (filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.search) params.append("search", filters.search);

    const response = await api.get(`/customers?${params.toString()}`);
    return {
      data: response.data?.customers || response.data?.data || [],
      pagination: response.data?.pagination || { total: 0, totalPages: 1, page: 1, limit: 20 },
    };
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data?.customer || response.data;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await api.post("/customers", data);
    return response.data?.customer || response.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data?.customer || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
