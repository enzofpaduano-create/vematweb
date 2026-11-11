import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCS_BUCKET = "documents-techniques";
export const MAX_DOC_BYTES = 25 * 1024 * 1024;

export interface SharedDocument {
  id: string;
  title: string;
  file_name: string;
  path: string;
  mime: string | null;
  size_bytes: number;
  created_at: string;
}

const COLS = "id, title, file_name, path, mime, size_bytes, created_at";

export async function listSharedDocuments(supabase: SupabaseClient): Promise<SharedDocument[]> {
  const { data, error } = await supabase.from("shared_documents").select(COLS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SharedDocument[];
}

/** Lien signé de 10 min : le fichier reste privé, jamais d'adresse publique. */
export async function signedDocumentUrl(supabase: SupabaseClient, d: SharedDocument, download: boolean): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(d.path, 600, download ? { download: d.file_name } : undefined);
  if (error || !data) throw new Error(error?.message ?? "Lien indisponible");
  return data.signedUrl;
}

export async function uploadSharedDocument(supabase: SupabaseClient, file: File, title: string): Promise<void> {
  if (file.size > MAX_DOC_BYTES) throw new Error("Fichier trop lourd (25 Mo maximum).");
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (up.error) throw new Error(up.error.message);
  const ins = await supabase.from("shared_documents").insert({
    title: title.trim().slice(0, 200) || file.name,
    file_name: file.name.slice(0, 200),
    path,
    mime: file.type || null,
    size_bytes: file.size,
  });
  if (ins.error) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]).catch(() => undefined);
    throw new Error(ins.error.message);
  }
}

export async function deleteSharedDocument(supabase: SupabaseClient, d: SharedDocument): Promise<void> {
  const del = await supabase.from("shared_documents").delete().eq("id", d.id);
  if (del.error) throw new Error(del.error.message);
  await supabase.storage.from(DOCS_BUCKET).remove([d.path]).catch(() => undefined);
}

export const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);
