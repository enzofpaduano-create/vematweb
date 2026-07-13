import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabasePdr } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface PdrAuthState {
  user: User | null;
  loading: boolean;
}

interface PdrAuthContextType extends PdrAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const PdrAuthContext = createContext<PdrAuthContextType | null>(null);

export function PdrAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PdrAuthState>({ user: null, loading: true });

  useEffect(() => {
    supabasePdr.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false });
    });
    const { data: { subscription } } = supabasePdr.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabasePdr.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabasePdr.auth.signOut();
    setState({ user: null, loading: false });
  };

  return (
    <PdrAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </PdrAuthContext.Provider>
  );
}

export function usePdrAuth() {
  const ctx = useContext(PdrAuthContext);
  if (!ctx) throw new Error("usePdrAuth must be used within PdrAuthProvider");
  return ctx;
}
