import { api } from "@/lib/api";
import type { LoginCredentials, RegisterData, AuthResponse, User } from "@/types";
import { parseAuthResponse, parseProfileResponse } from "./response";

export const authApi = {
  signup: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return parseAuthResponse(response.data);
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", credentials);
    return parseAuthResponse(response.data);
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return parseAuthResponse(response.data);
  },

  setup: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post("/auth/setup", data);
    return parseAuthResponse(response.data);
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/profile");
    return parseProfileResponse(response.data);
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
