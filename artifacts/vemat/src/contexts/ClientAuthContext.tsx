import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, Company } from "@/lib/database.types";

interface ClientAuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
}

interface ClientAuthContextType extends ClientAuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  companyRc: string;
  companyIce: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClientAuthState>({
    session: null,
    user: null,
    profile: null,
    company: null,
    loading: true,
  });

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profile) {
        setState((s) => ({ ...s, profile: null, company: null, loading: false }));
        return;
      }

      const { data: company } = profile.company_id
        ? await supabase.from("companies").select("*").eq("id", profile.company_id).single()
        : { data: null };

      setState((s) => ({ ...s, profile, company, loading: false }));
    } catch {
      setState((s) => ({ ...s, profile: null, company: null, loading: false }));
    }
  };

  useEffect(() => {
    // INITIAL_SESSION fires synchronously with the stored session — no need for getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Keep loading:true while profile query is in flight
        setState((s) => ({ ...s, session, user: session.user }));
        loadProfile(session.user.id);
      } else {
        setState((s) => ({ ...s, session: null, user: null, profile: null, company: null, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (data: SignUpData) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "Erreur lors de la création du compte" };

    // Use a SECURITY DEFINER RPC to bypass RLS during registration
    // (session may not be active yet when signUp resolves)
    const { error: rpcError } = await supabase.rpc("register_client", {
      p_user_id: authData.user.id,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_phone: data.phone || null,
      p_company_name: data.companyName,
      p_company_rc: data.companyRc || null,
      p_company_ice: data.companyIce || null,
      p_company_address: data.companyAddress || null,
      p_company_city: data.companyCity || null,
      p_company_country: data.companyCountry || "Maroc",
      p_company_phone: data.companyPhone || null,
    });

    if (rpcError) return { error: rpcError.message };

    // Profile + company now exist — reload so context has company set
    await loadProfile(authData.user.id);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState((s) => ({ ...s, session: null, user: null, profile: null, company: null }));
  };

  const refreshProfile = async () => {
    if (state.user) await loadProfile(state.user.id);
  };

  return (
    <ClientAuthContext.Provider value={{ ...state, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
}
