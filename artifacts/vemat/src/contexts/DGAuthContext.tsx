import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseDG } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";

interface DGAuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

interface DGAuthContextType extends DGAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const DGAuthContext = createContext<DGAuthContextType | null>(null);

export function DGAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DGAuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabaseDG
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("role", "vemat_dg")
        .single();

      if (!data) {
        await supabaseDG.auth.signOut();
        setState({ user: null, profile: null, loading: false });
        return;
      }
      setState((s) => ({ ...s, profile: data, loading: false }));
    } catch {
      setState((s) => ({ ...s, profile: null, loading: false }));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabaseDG.auth.onAuthStateChange((_event, session) => {
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
    const { data, error } = await supabaseDG.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const { data: profile } = await supabaseDG
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "vemat_dg") {
      await supabaseDG.auth.signOut();
      return { error: "Accès refusé. Ce compte n'a pas les droits Direction." };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabaseDG.auth.signOut();
    setState({ user: null, profile: null, loading: false });
  };

  return (
    <DGAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </DGAuthContext.Provider>
  );
}

export function useDGAuth() {
  const ctx = useContext(DGAuthContext);
  if (!ctx) throw new Error("useDGAuth must be used within DGAuthProvider");
  return ctx;
}
