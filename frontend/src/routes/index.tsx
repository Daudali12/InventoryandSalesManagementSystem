import { createBrowserRouter } from "react-router-dom";
import { Layout, AuthLayout } from "@/components/common/Layout";
import { LoginPage } from "@/features/auth/LoginPage";
import { AnalyticsPage } from "@/features/business/AnalyticsPage";
import { ReceiptPage } from "@/features/business/ReceiptPage";
import { ActivityPage } from "@/features/business/AdminPages";
import { RecoveryPage } from "@/features/business/RecoveryPage";
import POSPage from "@/features/pos/POSPage";
import { ProductsPage } from "@/features/inventory/ProductsPage";
import { CategoriesPage } from "@/features/inventory/CategoriesPage";
import { SuppliersPage } from "@/features/inventory/SuppliersPage";
import { InventoryPage } from "@/features/inventory/InventoryPage";
import { SalesPage } from "@/features/pos/SalesPage";
import { PurchasesPage } from "@/features/business/PurchasesPage";
import { CustomersPage } from "@/features/customers/CustomersPage";

import { SettingsPage } from "@/features/business/AdminPages";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { authApi } from "@/features/auth/api";
import { isAuthUser } from "@/features/auth/response";

function ProtectedRoute({ children, admin = false, owner = false }: { children: React.ReactNode; admin?: boolean; owner?: boolean }) {
  const user = useAuthStore(s => s.user);
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth-storage");
      if (token) {
        try {
          const parsed = JSON.parse(token);
          if (parsed.state?.accessToken) {
            const user = await authApi.getProfile();
            const currentSession = useAuthStore.getState();
            if (currentSession.accessToken && currentSession.refreshToken) {
              setAuth(user, currentSession.accessToken, currentSession.refreshToken);
            } else {
              currentSession.logout();
            }
          } else {
            useAuthStore.getState().logout();
          }
        } catch {
          useAuthStore.getState().logout();
          setLoading(false);
        }
      } else {
        useAuthStore.getState().logout();
      }
    };
    initAuth();
  }, [setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAuthUser(user)) {
    return <Navigate to="/login" replace />;
  }

  if ((admin && !["ADMIN", "MANAGER"].includes(user.role)) || (owner && user.role !== "ADMIN")) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

import { Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  { path: "/receipt/:id", element: <ProtectedRoute><ReceiptPage /></ProtectedRoute> },
  { path: "/reset-password", element: <AuthLayout><RecoveryPage /></AuthLayout> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "activity", element: <ProtectedRoute admin><ActivityPage /></ProtectedRoute> },
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <ProtectedRoute><AnalyticsPage /></ProtectedRoute>,
      },
      {
        path: "products",
        element: <ProtectedRoute><ProductsPage /></ProtectedRoute>,
      },
      {
        path: "categories",
        element: <ProtectedRoute admin><CategoriesPage /></ProtectedRoute>,
      },
      {
        path: "suppliers",
        element: <ProtectedRoute admin><SuppliersPage /></ProtectedRoute>,
      },
      {
        path: "inventory",
        element: <ProtectedRoute><InventoryPage /></ProtectedRoute>,
      },
      {
        path: "pos",
        element: <ProtectedRoute><POSPage /></ProtectedRoute>,
      },
      {
        path: "sales",
        element: <ProtectedRoute><SalesPage /></ProtectedRoute>,
      },
      {
        path: "purchases",
        element: <ProtectedRoute admin><PurchasesPage /></ProtectedRoute>,
      },
      {
        path: "customers",
        element: <ProtectedRoute admin><CustomersPage /></ProtectedRoute>,
      },
      {
        path: "reports",
        element: <ProtectedRoute admin><AnalyticsPage report /></ProtectedRoute>,
      },
      {
        path: "settings",
        element: <ProtectedRoute owner><SettingsPage /></ProtectedRoute>,
      },
      {
        path: "profile",
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: "/login",
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
