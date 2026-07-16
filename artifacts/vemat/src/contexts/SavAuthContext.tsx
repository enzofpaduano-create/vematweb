import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseSav } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface SavAuthState {
  user: User | null;
  loading: boolean;
}

interface SavAuthContextType extends SavAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const SavAuthContext = createContext<SavAuthContextType | null>(null);

export function SavAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavAuthState>({ user: null, loading: true });

  useEffect(() => {
    supabaseSav.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false });
    });
    const { data: { subscription } } = supabaseSav.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseSav.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabaseSav.auth.signOut();
    setState({ user: null, loading: false });
  };

  return (
    <SavAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </SavAuthContext.Provider>
  );
}

export function useSavAuth() {
  const ctx = useContext(SavAuthContext);
  if (!ctx) throw new Error("useSavAuth must be used within SavAuthProvider");
  return ctx;
}
