import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "./States";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking access" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          Your account ({user.email}) doesn't have admin access. Ask an existing admin to add you from the Users page.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
