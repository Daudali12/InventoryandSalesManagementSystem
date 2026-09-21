import { useState, useEffect, useRef } from "react";
import { UserPlus, Search, ChevronDown, Check, UserCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { customerApi } from "@/features/customers/api";
import { usePosStore } from "@/store/posStore";
import type { Customer } from "@/types";
import { toast } from "sonner";

export function CustomerSelector() {
  const { customerName, customerPhone, setCustomerInfo } = usePosStore();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch customers
  const fetchCustomers = async (searchTerm = "") => {
    setIsLoading(true);
    try {
      const res = await customerApi.getAll({ limit: 10, search: searchTerm });
      setCustomers(res.data);
    } catch {
      // Fallback silently if offline/error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers(search);
    }
  }, [isOpen, search]);

  const selectWalkIn = () => {
    setCustomerInfo("", "");
    setIsOpen(false);
  };

  const selectCustomer = (c: Customer) => {
    setCustomerInfo(c.name, c.phone || "", c.id);
    setIsOpen(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const created = await customerApi.create({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });
      toast.success(`Customer ${created.name} added`);
      setCustomerInfo(created.name, created.phone || "", created.id);
      setIsAddingNew(false);
      setNewName("");
      setNewPhone("");
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add customer";
      toast.error(msg);
    }
  };

  const isWalkIn = !customerName;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
        Customer
      </label>

      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all shadow-2xs group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs",
              isWalkIn
                ? "bg-slate-100 text-slate-600"
                : "bg-indigo-100 text-indigo-700"
            )}
          >
            {isWalkIn ? "W" : customerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {isWalkIn ? "Walk-in Customer" : customerName}
            </p>
            {customerPhone && (
              <p className="text-[10px] text-slate-500 font-mono truncate">{customerPhone}</p>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {!isAddingNew ? (
            <div className="p-2 space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search existing customer..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
                  autoFocus
                />
              </div>

              {/* Customer List */}
              <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-100">
                {/* Walk-in Option */}
                <button
                  type="button"
                  onClick={selectWalkIn}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Walk-in Customer</p>
                      <p className="text-[10px] text-slate-400">Default general sale</p>
                    </div>
                  </div>
                  {isWalkIn && <Check className="h-4 w-4 text-indigo-600" />}
                </button>

                {/* Customer Records */}
                {isLoading ? (
                  <div className="p-3 text-center text-xs text-slate-400">Loading customers...</div>
                ) : (
                  customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {c.phone || c.email || "No contact"}
                        </p>
                      </div>
                      {customerName === c.name && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>
                  ))
                )}
              </div>

              {/* Add New Customer Button */}
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add New Customer</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateCustomer} className="p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-xs font-bold text-slate-800">Quick Add Customer</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Full name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
              />

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Save &amp; Select
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
