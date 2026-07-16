import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Technician portal — isolated session
export const supabaseTech = createClient(url, anonKey, {
  auth: { storageKey: "vemat-tech-auth", autoRefreshToken: true, persistSession: true },
});

// PDR portal (pièces de rechange) — isolated session
export const supabasePdr = createClient(url, anonKey, {
  auth: { storageKey: "vemat-pdr-auth", autoRefreshToken: true, persistSession: true },
});

// SAV portal (service / interventions) — isolated session
export const supabaseSav = createClient(url, anonKey, {
  auth: { storageKey: "vemat-sav-auth", autoRefreshToken: true, persistSession: true },
});

// Public client — used for anonymous form submissions (no auth persistence needed)
export const supabasePublic = createClient(url, anonKey);
