import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";

interface ManagerAuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

interface ManagerAuthContextType extends ManagerAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const ManagerAuthContext = createContext<ManagerAuthContextType | null>(null);

export function ManagerAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ManagerAuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("role", "vemat_admin")
        .single();

      if (!data) {
        // Logged in but not a manager — sign them out
        await supabaseAdmin.auth.signOut();
        setState({ user: null, profile: null, loading: false });
        return;
      }
      setState((s) => ({ ...s, profile: data, loading: false }));
    } catch {
      setState((s) => ({ ...s, profile: null, loading: false }));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user }));
        loadProfile(session.user.id);
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Verify they're actually a manager
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "vemat_admin") {
      await supabaseAdmin.auth.signOut();
      return { error: "Accès refusé. Ce compte n'a pas les droits manager." };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabaseAdmin.auth.signOut();
    setState({ user: null, profile: null, loading: false });
  };

  return (
    <ManagerAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </ManagerAuthContext.Provider>
  );
}

export function useManagerAuth() {
  const ctx = useContext(ManagerAuthContext);
  if (!ctx) throw new Error("useManagerAuth must be used within ManagerAuthProvider");
  return ctx;
}
