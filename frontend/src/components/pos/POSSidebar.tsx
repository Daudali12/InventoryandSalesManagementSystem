import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Store,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

const posNavItems = [
  { name: "Register", href: "/pos", icon: ShoppingCart },
  { name: "Orders", href: "/sales", icon: Receipt },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function POSSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Toggle dark class on html document root
  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("theme", "dark");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 justify-between h-full select-none flex-shrink-0 z-20">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <NavLink
          to="/dashboard"
          className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
          title="Back to Main Dashboard"
        >
          <Store className="h-6 w-6" strokeWidth={2.5} />
          <span className="sr-only">POS Home</span>
        </NavLink>

        {/* Navigation Item Icons */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2">
          {posNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href + "/"));

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "relative group flex flex-col items-center justify-center w-13 h-13 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/35 scale-102"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                )}
                title={item.name}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-semibold tracking-tight mt-1 truncate max-w-[50px]">
                  {item.name.split(" ")[0]}
                </span>

                {/* Left Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Theme Toggle & User Avatar */}
      <div className="flex flex-col items-center gap-3 w-full px-2 pt-3 border-t border-slate-800">
        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Profile Avatar with dropdown tooltip */}
        <div className="relative group">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer hover:border-indigo-500 transition-all"
            title={`${user?.name || "User"} (${user?.role || "STAFF"})`}
          >
            {userInitial}
          </div>

          {/* Quick Logout Popover */}
          <div className="absolute left-full bottom-0 ml-3 mb-0 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 min-w-[140px]">
            <p className="text-xs font-semibold text-white px-2 py-1 truncate">
              {user?.name || "Cashier"}
            </p>
            <p className="text-[10px] text-slate-400 px-2 pb-1 capitalize">
              {user?.role?.toLowerCase() || "Staff"}
            </p>
            <hr className="border-slate-800 my-1" />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors w-full text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
