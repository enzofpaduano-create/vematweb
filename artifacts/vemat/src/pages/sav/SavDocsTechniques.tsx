import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink, FileText, Folder, FolderUp, Loader2, Trash2, Upload } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { supabaseSav } from "@/lib/supabase";
import {
  MAX_DOC_BYTES, cleanFolder, deleteSharedDocument, deleteSharedFolder, fmtSize, groupByFolder, isHiddenFile, isViewable,
  listSharedDocuments, signedDocumentUrl, uploadSharedDocument, type SharedDocument,
} from "@/lib/sharedDocuments";

type DirFile = File & { webkitRelativePath?: string };

/** Gestion du dossier « Document technique partagé avec vous » (direction uniquement : les règles Supabase refusent les autres). */
export default function SavDocsTechniques() {
  const [docs, setDocs] = useState<SharedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  const refresh = () => listSharedDocuments(supabaseSav).then(setDocs).catch((e: Error) => setError(e.message));
  useEffect(() => { refresh(); }, []);

  /** Dépose une liste de fichiers ; pour un dossier entier, l'arborescence est conservée (nom du dossier + sous-dossiers). */
  const upload = async (list: FileList | null, fromFolder: boolean) => {
    const all = Array.from(list ?? []) as DirFile[];
    if (all.length === 0) return;
    setError(null);
    setNotes([]);
    const skipped: string[] = [];
    const todo = all.filter((f) => {
      if (isHiddenFile(f.name)) return false; // .DS_Store, Thumbs.db…
      if (!isViewable(f.type, f.name)) { skipped.push(`« ${f.webkitRelativePath || f.name} » : format non consultable (PDF ou image uniquement, convertissez Word/Excel en PDF)`); return false; }
      if (f.size > MAX_DOC_BYTES) { skipped.push(`« ${f.webkitRelativePath || f.name} » (${fmtSize(f.size)}) : plus de 25 Mo`); return false; }
      if (f.size === 0) { skipped.push(`« ${f.webkitRelativePath || f.name} » : fichier vide`); return false; }
      return true;
    });
    setProgress({ done: 0, total: todo.length });
    let done = 0;
    let next = 0;
    // 3 dépôts en parallèle : assez rapide sans saturer la connexion.
    const worker = async () => {
      while (next < todo.length) {
        const f = todo[next++];
        const rel = fromFolder ? (f.webkitRelativePath ?? "").split("/").slice(0, -1).join("/") : "";
        const target = cleanFolder([folder, rel].filter(Boolean).join("/"));
        try {
          const single = todo.length === 1 && title.trim();
          await uploadSharedDocument(supabaseSav, f, single ? title : f.name.replace(/\.[^.]+$/, ""), target);
        } catch (e) {
          skipped.push(`« ${f.name} » : ${(e as Error).message}`);
        }
        setProgress({ done: ++done, total: todo.length });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setProgress(null);
    setNotes(skipped);
    if (skipped.length < all.length) setTitle("");
    if (filesRef.current) filesRef.current.value = "";
    if (dirRef.current) dirRef.current.value = "";
    await refresh();
  };

  const open = async (d: SharedDocument) => {
    try { window.open(await signedDocumentUrl(supabaseSav, d, false), "_blank", "noopener"); } catch (e) { setError((e as Error).message); }
  };
  const remove = async (d: SharedDocument) => {
    if (!confirm(`Supprimer « ${d.title} » ? Les techniciens ne le verront plus.`)) return;
    try { await deleteSharedDocument(supabaseSav, d); await refresh(); } catch (e) { setError((e as Error).message); }
  };
  const removeFolder = async (name: string, list: SharedDocument[]) => {
    if (!confirm(`Supprimer le dossier « ${name} » et ses ${list.length} fichier(s) ? Cette action est définitive.`)) return;
    try { await deleteSharedFolder(supabaseSav, list); await refresh(); } catch (e) { setError((e as Error).message); }
  };

  const groups = docs ? groupByFolder(docs) : [];

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 md:p-8 max-w-3xl">
          <h1 className="text-2xl font-black text-zinc-900">Documents techniques</h1>
          <p className="text-sm text-zinc-500 mb-6">Dossier « Document technique partagé avec vous », visible par les techniciens dans Catalogues. 25 Mo maximum par fichier, PDF ou images uniquement (un Word ou un Excel est à convertir en PDF). Les techniciens consultent les documents mais ne peuvent pas les télécharger.</p>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Ranger dans le sous-dossier (facultatif)</label>
              <input value={folder} onChange={(e) => setFolder(e.target.value)} maxLength={200} placeholder="Ex. Manuels/RT 780" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Titre affiché (un seul fichier, facultatif)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Ex. Manuel d'entretien RT 780" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            </div>
            <input ref={filesRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files, false)} />
            <input
              ref={(el) => { dirRef.current = el; if (el) { el.setAttribute("webkitdirectory", ""); el.setAttribute("directory", ""); } }}
              type="file" multiple className="hidden" onChange={(e) => upload(e.target.files, true)}
            />
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => filesRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Ajouter des fichiers
              </button>
              <button type="button" disabled={busy} onClick={() => dirRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-bold disabled:opacity-60">
                <FolderUp className="h-4 w-4" /> Ajouter un dossier entier
              </button>
            </div>
            {progress && (
              <div>
                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} /></div>
                <p className="text-xs text-zinc-500 mt-1">{progress.done} / {progress.total} fichiers déposés. Ne fermez pas la page.</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 flex items-center gap-2 mb-4"><AlertCircle className="h-4 w-4" /> {error}</p>}
          {notes.length > 0 && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="font-bold mb-1">{notes.length} fichier(s) non ajouté(s) :</p>
              <ul className="list-disc pl-5 space-y-0.5">{notes.slice(0, 15).map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          )}
          {docs === null && !error && <div className="h-20 rounded-xl bg-zinc-100 animate-pulse" />}
          {docs && docs.length === 0 && <p className="text-sm text-zinc-400">Aucun document.</p>}
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.folder || "racine"}>
                {(g.folder || groups.length > 1) && (
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="flex items-center gap-2 text-sm font-black text-zinc-800"><Folder className="h-4 w-4 text-emerald-600" /> {g.folder ? g.folder.split("/").join(" › ") : "Racine"} <span className="text-xs font-normal text-zinc-400">({g.docs.length})</span></h2>
                    {g.folder && <button type="button" onClick={() => removeFolder(g.folder, g.docs)} className="text-xs text-zinc-400 hover:text-red-600 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Supprimer le dossier</button>}
                  </div>
                )}
                <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                  {g.docs.map((d) => (
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
              </section>
            ))}
          </div>
        </div>
      </SavLayout>
    </SavGuard>
  );
}
