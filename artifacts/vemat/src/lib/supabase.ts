import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Technician portal — isolated session
export const supabaseTech = createClient(url, anonKey, {
  auth: { storageKey: "vemat-tech-auth", autoRefreshToken: true, persistSession: true },
});

// Public client — used for anonymous form submissions (no auth persistence needed)
export const supabasePublic = createClient(url, anonKey);
