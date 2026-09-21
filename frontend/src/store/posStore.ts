import { create } from "zustand";
import type { Product } from "@/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface PosState {
  cart: CartItem[];
  discount: number;
  discountType: "percentage" | "fixed";
  customerId?: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  paymentMethod: "CASH" | "CARD" | "ONLINE";
  receivedAmount: number;
  searchQuery: string;
  selectedCategoryId: string | null;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (discount: number, type?: "percentage" | "fixed") => void;
  setCustomerInfo: (name: string, phone: string, id?: string) => void;
  setNotes: (notes: string) => void;
  setPaymentMethod: (method: "CASH" | "CARD" | "ONLINE") => void;
  setReceivedAmount: (amount: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
  getChange: () => number;
  getItemCount: () => number;
}

const TAX_RATE = 0;

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  discount: 0,
  discountType: "percentage",
  customerName: "",
  customerPhone: "",
  notes: "",
  paymentMethod: "CASH",
  receivedAmount: 0,
  searchQuery: "",
  selectedCategoryId: null,

  addToCart: (product, quantity = 1) => {
    if (product.stockQuantity <= 0) return;
    const cart = get().cart;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: Math.min(product.stockQuantity, newCart[existingIndex].quantity + quantity),
      };
      set({ cart: newCart });
    } else {
      set({ cart: [...cart, { product, quantity }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(item.product.stockQuantity, Math.floor(quantity)) } : item
      ),
    });
  },

  clearCart: () => {
    set({
      cart: [],
      discount: 0,
      discountType: "percentage",
      customerId: undefined,
      customerName: "",
      customerPhone: "",
      notes: "",
      paymentMethod: "CASH",
      receivedAmount: 0,
    });
  },

  setDiscount: (discount, type = "percentage") => {
    set({ discount: Math.max(0, discount), discountType: type });
  },

  setCustomerInfo: (name, phone, id) => {
    set({ customerName: name, customerPhone: phone, customerId: id });
  },

  setNotes: (notes) => set({ notes }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setReceivedAmount: (amount) => set({ receivedAmount: Math.max(0, amount) }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountType } = get();
    if (discountType === "percentage") {
      return Math.round(subtotal * (Math.min(discount, 100) / 100) * 100) / 100;
    }
    return Math.min(discount, subtotal);
  },

  getTaxAmount: (taxRate = TAX_RATE) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return Math.round((subtotal - discountAmount) * (taxRate / 100) * 100) / 100;
  },

  getTotal: (taxRate = TAX_RATE) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const taxAmount = get().getTaxAmount(taxRate);
    return Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;
  },

  getChange: () => {
    const total = get().getTotal();
    const { receivedAmount, paymentMethod } = get();
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, receivedAmount - total);
  },

  getItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

export const getPosStore = () => usePosStore.getState();
