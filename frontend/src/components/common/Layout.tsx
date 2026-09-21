import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Box } from "lucide-react";
import { cn } from "@/utils/cn";

export function Layout() {
  const location = useLocation();
  const isPOS = location.pathname === "/pos" || location.pathname.startsWith("/pos/");

  // When on POS terminal, render full-screen immersive layout with dedicated 3-column architecture
  if (isPOS) {
    return (
      <div className="h-screen w-screen overflow-auto md:overflow-hidden bg-slate-100 flex">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/30 overflow-hidden hover-shine mb-4 icon-glow">
            <Box className="h-10 w-10 text-white z-10" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">Nexus POS</h1>
          <p className="text-gray-500 mt-2 font-medium">Inventory & Sales Management</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}