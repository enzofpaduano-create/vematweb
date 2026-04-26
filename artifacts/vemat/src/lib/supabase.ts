import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Client portal — auth sessions stored under 'vemat-client-auth'
export const supabase = createClient(url, anonKey, {
  auth: { storageKey: "vemat-client-auth", autoRefreshToken: true, persistSession: true },
});

// Admin portal — separate auth session so client & admin don't collide
export const supabaseAdmin = createClient(url, anonKey, {
  auth: { storageKey: "vemat-admin-auth", autoRefreshToken: true, persistSession: true },
});

// Technician portal — isolated session
export const supabaseTech = createClient(url, anonKey, {
  auth: { storageKey: "vemat-tech-auth", autoRefreshToken: true, persistSession: true },
});

// Direction (DG) portal — isolated session
export const supabaseDG = createClient(url, anonKey, {
  auth: { storageKey: "vemat-dg-auth", autoRefreshToken: true, persistSession: true },
});

// Commercial portal — isolated session
export const supabaseCommercial = createClient(url, anonKey, {
  auth: { storageKey: "vemat-commercial-auth", autoRefreshToken: true, persistSession: true },
});

// Public client — used for anonymous form submissions (no auth persistence needed)
export const supabasePublic = createClient(url, anonKey);
