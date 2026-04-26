import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabaseTech } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Technician } from "@/lib/database.types";

interface TechnicienAuthState {
  user: User | null;
  technician: Technician | null;
  loading: boolean;
}

interface TechnicienAuthContextType extends TechnicienAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const TechnicienAuthContext = createContext<TechnicienAuthContextType | null>(null);

export function TechnicienAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TechnicienAuthState>({
    user: null,
    technician: null,
    loading: true,
  });

  const loadTechnician = async (userId: string) => {
    try {
      const { data } = await supabaseTech
        .from("technicians")
        .select("*")
        .eq("user_id", userId)
        .single();
      setState((s) => ({ ...s, technician: data ?? null, loading: false }));
    } catch {
      setState((s) => ({ ...s, technician: null, loading: false }));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabaseTech.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user }));
        loadTechnician(session.user.id);
      } else {
        setState({ user: null, technician: null, loading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseTech.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabaseTech.auth.signOut();
    setState({ user: null, technician: null, loading: false });
  };

  return (
    <TechnicienAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </TechnicienAuthContext.Provider>
  );
}

export function useTechnicienAuth() {
  const ctx = useContext(TechnicienAuthContext);
  if (!ctx) throw new Error("useTechnicienAuth must be used within TechnicienAuthProvider");
  return ctx;
}
