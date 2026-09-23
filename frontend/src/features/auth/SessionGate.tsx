import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "./api";
import { handleApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";

let verification: { version: number; promise: Promise<User> } | null = null;
function verifySession(version: number) {
  if (verification?.version === version) return verification.promise;
  const promise = authApi.getProfile().finally(() => {
    if (verification?.promise === promise) verification = null;
  });
  verification = { version, promise };
  return promise;
}

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshToken, sessionVersion } = useAuthStore();
  const [verifiedVersion, setVerifiedVersion] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const session = useAuthStore.getState();
    if (!session.accessToken || !session.refreshToken) return;
    session.setLoading(true);
    verifySession(sessionVersion).then(user => {
      if (!active || useAuthStore.getState().sessionVersion !== sessionVersion) return;
      useAuthStore.getState().setVerifiedUser(user);
      setVerifiedVersion(sessionVersion);
      setError("");
    }).catch(reason => {
      if (!active || useAuthStore.getState().sessionVersion !== sessionVersion) return;
      useAuthStore.getState().setLoading(false);
      setError(handleApiError(reason));
    });
    return () => { active = false; };
  }, [sessionVersion, attempt]);

  if (!accessToken || !refreshToken) return <Navigate to="/login" replace />;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
    <p role="alert">{error}</p>
    <div className="flex gap-3"><Button onClick={() => { setError(""); setAttempt(value => value + 1); }}>Retry</Button>
      <Button variant="outline" onClick={() => useAuthStore.getState().logout()}>Back to sign in</Button></div>
  </div>;
  if (verifiedVersion !== sessionVersion) return <div role="status" className="min-h-screen flex items-center justify-center">Verifying your session...</div>;
  return <>{children}</>;
}
