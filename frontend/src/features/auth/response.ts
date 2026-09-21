import type { AuthResponse, User } from "@/types";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  typeof value === "object" && value !== null ? value as RecordValue : {};

export function isAuthUser(value: unknown): value is User {
  const user = record(value);
  return typeof user.id === "string" && typeof user.name === "string" &&
    typeof user.email === "string" &&
    ["ADMIN", "MANAGER", "STAFF"].includes(String(user.role));
}

export function parseAuthResponse(value: unknown): AuthResponse {
  const envelope = record(value);
  const data = envelope.data === undefined ? envelope : record(envelope.data);
  const accessToken = data.accessToken ?? data.token;
  if (!isAuthUser(data.user) || typeof accessToken !== "string" || !accessToken ||
      typeof data.refreshToken !== "string" || !data.refreshToken) {
    throw new Error("The server returned an incomplete login response. Please try signing in again.");
  }
  return { user: data.user, accessToken, refreshToken: data.refreshToken };
}

export function parseProfileResponse(value: unknown): User {
  const envelope = record(value);
  const nested = record(envelope.data);
  const user = envelope.user ?? nested.user ?? envelope.data;
  if (!isAuthUser(user)) throw new Error("Your session could not be verified. Please sign in again.");
  return user;
}
