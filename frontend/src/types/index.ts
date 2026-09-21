export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    products: number;
  };
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  company?: string | null;
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  _count?: {
    products: number;
  };
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  imageUrl?: string | null;
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string | null;
  supplierId: string | null;
  category?: Category;
  supplier?: Supplier;
  stockMovements?: StockMovement[];
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface StockMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "DAMAGED";
  quantity: number;
  reason: string | null;
  productId: string;
  userId: string;
  product?: Product;
  user?: User;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

export interface Sale {
  paymentMethod: "CASH" | "CARD" | "ONLINE";
  taxRate: number;
  taxAmount: number;
  customerId?: string;
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  status: "COMPLETED" | "CANCELLED";
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  userId: string;
  user?: User;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paymentMethod: "CASH" | "CARD" | "ONLINE";
  userId: string;
  user?: User;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalUsers: number;
  lowStockCount: number;
  totalSales: number;
  totalRevenue: number;
  totalStockValue: number;
}

export interface RecentSale {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  itemCount: number;
  soldBy: string;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentSales: RecentSale[];
}

export interface SalesReportData {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  sales: Sale[];
}

export interface InventoryReportData {
  totalProducts: number;
  totalStockValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  byCategory: Record<string, { count: number; stockValue: number; totalQuantity: number }>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: "daily" | "weekly" | "monthly";
}

export interface ProductFilters {
  stock?: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
}

export interface SaleFilters {
  paymentMethod?: string;
  page?: number;
  limit?: number;
  status?: "COMPLETED" | "CANCELLED";
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}