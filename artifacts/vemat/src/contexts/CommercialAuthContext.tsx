import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseCommercial } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Commercial } from "@/lib/database.types";

interface CommercialAuthState {
  user: User | null;
  commercial: Commercial | null;
  loading: boolean;
}

interface CommercialAuthContextType extends CommercialAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const CommercialAuthContext = createContext<CommercialAuthContextType | null>(null);

export function CommercialAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommercialAuthState>({ user: null, commercial: null, loading: true });

  const loadCommercial = async (userId: string) => {
    try {
      const { data } = await supabaseCommercial.from("commercials").select("*").eq("user_id", userId).single();
      setState((s) => ({ ...s, commercial: data ?? null, loading: false }));
    } catch {
      setState((s) => ({ ...s, commercial: null, loading: false }));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabaseCommercial.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user }));
        loadCommercial(session.user.id);
      } else {
        setState({ user: null, commercial: null, loading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseCommercial.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabaseCommercial.auth.signOut();
    setState({ user: null, commercial: null, loading: false });
  };

  return (
    <CommercialAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </CommercialAuthContext.Provider>
  );
}

export function useCommercialAuth() {
  const ctx = useContext(CommercialAuthContext);
  if (!ctx) throw new Error("useCommercialAuth must be used within CommercialAuthProvider");
  return ctx;
}
