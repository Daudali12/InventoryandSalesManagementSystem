import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAuthStore } from "@/store/authStore";
import { parseTokenResponse } from "@/features/auth/response";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number };
const publicAuth = /\/auth\/(login|signup|setup|refresh|forgot-password|recover-password|logout)(?:\?|$)/;

api.interceptors.request.use((config: SessionRequest) => {
  const session = getAuthStore();
  config._sessionVersion = session.sessionVersion;
  if (session.accessToken && !publicAuth.test(config.url || "")) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

let refreshing: { version: number; promise: Promise<string> } | null = null;

function renewSession(version: number): Promise<string> {
  if (refreshing?.version === version) return refreshing.promise;
  const refreshToken = getAuthStore().refreshToken;
  const promise = (async () => {
    try {
      if (!refreshToken) throw new Error("Your session has ended. Please sign in again.");
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 30000 });
      const tokens = parseTokenResponse(response.data);
      if (getAuthStore().sessionVersion !== version) throw new Error("Session changed during authentication.");
      getAuthStore().setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } catch (error) {
      // An offline server is not evidence that the user's credentials are invalid.
      if (getAuthStore().sessionVersion === version &&
          (!refreshToken || (axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status || 0)))) {
        getAuthStore().logout();
      }
      throw error;
    } finally {
      if (refreshing?.version === version) refreshing = null;
    }
  })();
  refreshing = { version, promise };
  return promise;
}

api.interceptors.response.use(response => response, async (error: AxiosError) => {
  const request = error.config as SessionRequest | undefined;
  if (!request || error.response?.status !== 401 || publicAuth.test(request.url || "")) return Promise.reject(error);
  const session = getAuthStore();
  if (request._sessionVersion !== session.sessionVersion) return Promise.reject(error);
  if (request._retry) {
    session.logout();
    return Promise.reject(error);
  }
  request._retry = true;
  // Another concurrent request may already have renewed this token.
  const currentAuthorization = session.accessToken ? `Bearer ${session.accessToken}` : undefined;
  if (currentAuthorization && request.headers.Authorization !== currentAuthorization) {
    request.headers.Authorization = currentAuthorization;
  } else {
    const accessToken = await renewSession(session.sessionVersion);
    request.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (getAuthStore().sessionVersion !== request._sessionVersion) return Promise.reject(error);
  return api(request);
});

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Cannot connect to the server. Check your connection and try again.";
    return error.response.data?.message || error.message || "An error occurred";
  }
  return error instanceof Error ? error.message : "An unexpected error occurred";
};
