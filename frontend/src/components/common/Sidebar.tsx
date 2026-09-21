import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Box,
  Tag,
  CreditCard,
  ClipboardList,
  Store
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

const navigation = [
  { name: "POS Terminal", href: "/pos", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { name: "Products", href: "/products", icon: Package, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { name: "Categories", href: "/categories", icon: Tag, roles: ["ADMIN", "MANAGER"] },
  { name: "Inventory", href: "/inventory", icon: Box, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { name: "Sales History", href: "/sales", icon: CreditCard, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["ADMIN", "MANAGER"] },
  { name: "Purchases", href: "/purchases", icon: ClipboardList, roles: ["ADMIN", "MANAGER"] },
  { name: "Analytics", href: "/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { name: "Activity log", href: "/activity", icon: ClipboardList, roles: ["ADMIN", "MANAGER"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNav = navigation.filter((item) =>
    user && item.roles.includes(user.role)
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col h-screen lg:sticky top-0",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {!isCollapsed && (
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-500/30 overflow-hidden hover-shine">
                <Store className="h-5 w-5 text-white z-10" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-slate-100 text-sm tracking-wide">POS CORE</h1>
                <p className="text-xs text-slate-400">Retail v1.0</p>
              </div>
            </NavLink>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin" aria-label="Main navigation">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href + "/"));

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-slate-800 text-white shadow-sm border-l-2 border-indigo-500 hover-shine"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0 icon-glow", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400")} aria-hidden="true" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs">
          {!isCollapsed && user && (
            <div className="mb-4">
              <p className="font-semibold text-slate-200">Logged in as:</p>
              <p className="text-slate-400 truncate">{user.email} ({user.role})</p>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors w-full",
              isCollapsed && "justify-center px-2 mx-auto"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileOpen(false)} />
        )}
    </>
  );
}
