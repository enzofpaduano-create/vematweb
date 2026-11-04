import type { SupabaseClient } from "@supabase/supabase-js";

/** What the shared register screen needs to know about the portal it runs in. */
export interface RegisterPortal {
  portal: "pdr" | "sav";
  sb: SupabaseClient;
  userEmail: string | null;
  base: "/espace-pdr" | "/espace-sav";
  /** Tailwind classes of the portal accent (sky for PDR, emerald for SAV). */
  accent: { solid: string; soft: string; text: string; ring: string };
}

export const PDR_ACCENT = {
  solid: "bg-sky-600 hover:bg-sky-500 text-white",
  soft: "bg-sky-50 text-sky-700 border-sky-200",
  text: "text-sky-600",
  ring: "focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
};
export const SAV_ACCENT = {
  solid: "bg-emerald-600 hover:bg-emerald-500 text-white",
  soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
  text: "text-emerald-600",
  ring: "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100",
};

export const INPUT_CLS =
  "w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none";
