import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowLeft, Download, ExternalLink, FileText, FolderOpen, Loader2 } from "lucide-react";
import { TechnicienLayout } from "./TechnicienLayout";
import { supabaseTech } from "@/lib/supabase";
import { useLang } from "@/i18n/I18nProvider";
import { fmtSize, listSharedDocuments, signedDocumentUrl, type SharedDocument } from "@/lib/sharedDocuments";

export default function TechnicienDocuments() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const [docs, setDocs] = useState<SharedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSharedDocuments(supabaseTech)
      .then((d) => { if (!cancelled) setDocs(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const act = async (d: SharedDocument, download: boolean) => {
    setBusy(d.id + (download ? "d" : "o"));
    setError(null);
    try {
      const url = await signedDocumentUrl(supabaseTech, d, download);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = d.file_name;
        a.click();
      } else {
        window.open(url, "_blank", "noopener");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <TechnicienLayout>
      <div className="p-6 lg:p-10 max-w-[1000px] mx-auto bg-zinc-50 min-h-screen">
        <Link href="/espace-technicien/catalogues" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-5">
          <ArrowLeft className="h-4 w-4" /> {fr ? "Catalogues" : "Catalogues"}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><FolderOpen className="h-6 w-6" /></div>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-950">{fr ? "Document technique partagé avec vous" : "Technical documents shared with you"}</h1>
        </div>
        <p className="text-zinc-500 text-sm mb-8">{fr ? "Documents mis à disposition par la direction. Accès réservé aux techniciens Vemat." : "Documents made available by management. Vemat technicians only."}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}
        {docs === null && !error && <div className="text-zinc-400 text-sm py-16 text-center animate-pulse">{fr ? "Chargement…" : "Loading…"}</div>}
        {docs && docs.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
            <FolderOpen className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="font-bold text-zinc-700">{fr ? "Aucun document pour l'instant" : "No documents yet"}</p>
          </div>
        )}
        {docs && docs.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-4 py-4">
                <FileText className="h-6 w-6 text-orange-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-900 truncate">{d.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{d.file_name} · {fmtSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString(fr ? "fr-FR" : "en-GB")}</p>
                </div>
                <button type="button" onClick={() => act(d, false)} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold disabled:opacity-60">
                  {busy === d.id + "o" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} {fr ? "Ouvrir" : "Open"}
                </button>
                <button type="button" onClick={() => act(d, true)} disabled={busy !== null} className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60" aria-label={fr ? "Télécharger" : "Download"}>
                  {busy === d.id + "d" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TechnicienLayout>
  );
}
