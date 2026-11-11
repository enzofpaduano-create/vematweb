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
  /** sous-dossier (« Manuels/RT 780 »), vide = racine */
  folder: string;
}

const COLS = "id, title, file_name, path, mime, size_bytes, created_at, folder";

/** Nettoie un chemin de dossier venu d'un navigateur : pas de « .. », pas de barre arrière, 6 niveaux maximum. */
export function cleanFolder(raw: string): string {
  return raw
    .replace(/\\/g, "/")
    .split("/")
    .map((x) => x.trim())
    .filter((x) => x && x !== "." && x !== "..")
    .slice(0, 6)
    .join("/")
    .slice(0, 300);
}

const HIDDEN = /^(\.|thumbs\.db$|desktop\.ini$)/i;
/** Fichiers système qu'un dossier glissé contient souvent (.DS_Store, Thumbs.db…) : ignorés. */
export const isHiddenFile = (name: string) => HIDDEN.test(name);

export function groupByFolder(docs: SharedDocument[]): { folder: string; docs: SharedDocument[] }[] {
  const map = new Map<string, SharedDocument[]>();
  for (const d of docs) map.set(d.folder ?? "", [...(map.get(d.folder ?? "") ?? []), d]);
  return [...map.entries()]
    .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" })))
    .map(([folder, list]) => ({ folder, docs: list.sort((x, y) => x.title.localeCompare(y.title, "fr", { numeric: true, sensitivity: "base" })) }));
}

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

export async function uploadSharedDocument(supabase: SupabaseClient, file: File, title: string, folder = ""): Promise<void> {
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
    folder: cleanFolder(folder),
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

/** Supprime tous les fichiers d'un dossier (et de ses sous-dossiers). */
export async function deleteSharedFolder(supabase: SupabaseClient, docs: SharedDocument[]): Promise<void> {
  for (const d of docs) await deleteSharedDocument(supabase, d);
}

/** Formats consultables dans l'application : PDF et images (un Word ou un Excel doit être converti en PDF avant partage). */
export const isViewable = (mime: string | null | undefined, fileName: string): boolean =>
  /^application\/pdf$/i.test(mime ?? "") || /^image\/(png|jpe?g|webp|gif)$/i.test(mime ?? "") || /\.(pdf|png|jpe?g|webp|gif)$/i.test(fileName);

export const isPdf = (d: Pick<SharedDocument, "mime" | "file_name">) => /pdf/i.test(d.mime ?? "") || /\.pdf$/i.test(d.file_name);

/** Lecture seule : le fichier est récupéré en mémoire pour l'affichage, sans lien public ni lien de téléchargement. */
export async function fetchDocumentBlob(supabase: SupabaseClient, d: SharedDocument): Promise<Blob> {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).download(d.path);
  if (error || !data) throw new Error(error?.message ?? "Document indisponible");
  return data;
}

export async function getSharedDocument(supabase: SupabaseClient, id: string): Promise<SharedDocument> {
  const { data, error } = await supabase.from("shared_documents").select(COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Document introuvable");
  return data as SharedDocument;
}
