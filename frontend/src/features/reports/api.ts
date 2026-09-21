import { api } from "@/lib/api";
import type { DashboardData, SalesReportData, InventoryReportData, ReportFilters } from "@/types";

export const reportApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get("/reports/dashboard");
    return response.data;
  },

  getSalesReport: async (filters?: ReportFilters): Promise<SalesReportData> => {
    const params = new URLSearchParams();
    if (filters?.period) params.append("period", filters.period);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(`/reports/sales?${params.toString()}`);
    return response.data;
  },

  getInventoryReport: async (): Promise<InventoryReportData> => {
    const response = await api.get("/reports/inventory");
    return response.data;
  },
};