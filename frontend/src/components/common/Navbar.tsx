import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NavLink } from "react-router-dom";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<{id:string;message:string;href:string}[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationError, setNotificationError] = useState(false);
  useEffect(() => { const load = () => api.get('/notifications').then(r => { setNotifications(r.data.notifications); setNotificationError(false); }).catch(() => setNotificationError(true)); load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, []);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            Inventory &amp; Sales Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications bell — no dummy data */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5 text-gray-500" /><span className="text-xs">{notifications.length}</span>
          </Button>

          {notificationsOpen && <div className="absolute right-4 top-16 w-80 max-w-[90vw] max-h-96 overflow-auto bg-white shadow-xl border rounded-xl p-4 z-40"><h2 className="font-bold mb-2">Notifications</h2>{notificationError ? <p>Unable to load notifications.</p> : !notifications.length ? <p>No new alerts.</p> : notifications.map(n => <NavLink onClick={() => setNotificationsOpen(false)} key={n.id} to={n.href} className="block py-3 border-t text-sm">{n.message}</NavLink>)}</div>}
          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pr-3 pl-2"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 leading-tight capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </Button>

            {userMenuOpen && (
              <>
                {/* Overlay to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Settings
                  </NavLink>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}