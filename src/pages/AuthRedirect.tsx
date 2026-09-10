import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthRedirect({ mode = "login" }: { mode?: "login" | "register" }) {
  const { user, loading, authError, signIn, register } = useAuth();
  const location = useLocation();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (loading || user || authError) return;
    void (mode === "register" ? register(destination) : signIn(destination));
  }, [authError, destination, loading, mode, register, signIn, user]);

  if (user) return <Navigate to={destination} replace />;
  if (authError) {
    return <main className="min-h-screen grid place-items-center p-4 text-center text-sm text-destructive" role="alert">{authError}</main>;
  }
  return <main className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>;
}
