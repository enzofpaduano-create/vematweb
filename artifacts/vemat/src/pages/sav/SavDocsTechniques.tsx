import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { supabaseSav } from "@/lib/supabase";
import { MAX_DOC_BYTES, deleteSharedDocument, fmtSize, listSharedDocuments, signedDocumentUrl, uploadSharedDocument, type SharedDocument } from "@/lib/sharedDocuments";

/** Gestion du dossier « Document technique partagé avec vous » (direction uniquement : les règles Supabase refusent les autres). */
export default function SavDocsTechniques() {
  const [docs, setDocs] = useState<SharedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => listSharedDocuments(supabaseSav).then(setDocs).catch((e: Error) => setError(e.message));
  useEffect(() => { refresh(); }, []);

  const onFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setError(null);
    if (f.size > MAX_DOC_BYTES) { setError(`« ${f.name} » pèse ${fmtSize(f.size)} : 25 Mo maximum.`); return; }
    setBusy(true);
    try {
      await uploadSharedDocument(supabaseSav, f, title || f.name.replace(/\.[^.]+$/, ""));
      setTitle("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const open = async (d: SharedDocument) => {
    try { window.open(await signedDocumentUrl(supabaseSav, d, false), "_blank", "noopener"); } catch (e) { setError((e as Error).message); }
  };
  const remove = async (d: SharedDocument) => {
    if (!confirm(`Supprimer « ${d.title} » ? Les techniciens ne le verront plus.`)) return;
    try { await deleteSharedDocument(supabaseSav, d); await refresh(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 md:p-8 max-w-3xl">
          <h1 className="text-2xl font-black text-zinc-900">Documents techniques</h1>
          <p className="text-sm text-zinc-500 mb-6">Dossier « Document technique partagé avec vous », visible par les techniciens dans Catalogues. 25 Mo maximum par fichier.</p>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
            <label className="block text-xs font-semibold text-zinc-500 mb-1">Titre affiché (facultatif)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Ex. Manuel d'entretien RT 780" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm mb-3" />
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Ajouter un fichier
            </button>
          </div>

          {error && <p className="text-sm text-red-600 flex items-center gap-2 mb-4"><AlertCircle className="h-4 w-4" /> {error}</p>}
          {docs === null && !error && <div className="h-20 rounded-xl bg-zinc-100 animate-pulse" />}
          {docs && docs.length === 0 && <p className="text-sm text-zinc-400">Aucun document.</p>}
          {docs && docs.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">{d.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{d.file_name} · {fmtSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button type="button" onClick={() => open(d)} className="p-2 text-zinc-500 hover:text-zinc-900" aria-label="Ouvrir"><ExternalLink className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(d)} className="p-2 text-zinc-400 hover:text-red-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SavLayout>
    </SavGuard>
  );
}
