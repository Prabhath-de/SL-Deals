import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  displayName: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function checkAdmin(userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (s: Session | null) => {
    setSession(s);
    setIsAdmin(s?.user ? await checkAdmin(s.user.id) : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) applySession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer the role lookup so it never runs inside the auth callback.
      setTimeout(() => {
        if (active) applySession(s);
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as { full_name?: string };
    return {
      user,
      session,
      isAdmin,
      loading,
      displayName: meta.full_name || user?.email?.split("@")[0] || "",
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshRole: async () => {
        if (session?.user) setIsAdmin(await checkAdmin(session.user.id));
      },
    };
  }, [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
