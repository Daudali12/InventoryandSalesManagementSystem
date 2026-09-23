import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "@/types";
import { isAuthUser } from "@/features/auth/response";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionVersion: number;
  setVerifiedUser: (user: User) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      sessionVersion: 0,

      setAuth: (user, accessToken, refreshToken) => {
        if (!isAuthUser(user) || !accessToken || !refreshToken) {
          get().logout();
          throw new Error("Your login session is incomplete. Please sign in again.");
        }
        set({
          sessionVersion: get().sessionVersion + 1,
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => { if (isAuthUser(user)) set({ user }); },
      setVerifiedUser: (user) => {
        if (!isAuthUser(user)) throw new Error("Your session could not be verified.");
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () =>
        set({
          sessionVersion: get().sessionVersion + 1,
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const getAuthStore = () => useAuthStore.getState();
