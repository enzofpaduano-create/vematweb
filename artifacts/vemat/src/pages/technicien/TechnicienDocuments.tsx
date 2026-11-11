import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowLeft, Eye, FileText, Folder, FolderOpen } from "lucide-react";
import { TechnicienLayout } from "./TechnicienLayout";
import { supabaseTech } from "@/lib/supabase";
import { useLang } from "@/i18n/I18nProvider";
import { fmtSize, groupByFolder, isViewable, listSharedDocuments, type SharedDocument } from "@/lib/sharedDocuments";

export default function TechnicienDocuments() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const [docs, setDocs] = useState<SharedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    listSharedDocuments(supabaseTech)
      .then((d) => { if (!cancelled) setDocs(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const groups = docs ? groupByFolder(docs) : [];
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
        <p className="text-zinc-500 text-sm mb-8">{fr ? "Documents mis à disposition par la direction, en consultation seule. Accès réservé aux techniciens Vemat." : "Documents made available by management, view only. Vemat technicians only."}</p>

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
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-xs text-zinc-500">{docs.length} {fr ? "documents" : "documents"} · {fmtSize(docs.reduce((n, d) => n + d.size_bytes, 0))}</p>
            </div>
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.folder || "racine"}>
                  {(g.folder || groups.length > 1) && (
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h2 className="flex items-center gap-2 text-sm font-black text-zinc-800 min-w-0">
                        <Folder className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="truncate">{g.folder ? g.folder.split("/").join(" › ") : fr ? "Documents" : "Documents"}</span>
                      </h2>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                    {g.docs.map((d) => (
                      <div key={d.id} className="flex items-center gap-4 px-4 py-4">
                        <FileText className="h-6 w-6 text-orange-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-900 truncate">{d.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{fmtSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString(fr ? "fr-FR" : "en-GB")}</p>
                        </div>
                        {isViewable(d.mime, d.file_name) ? (
                          <Link href={`/espace-technicien/documents-techniques/${d.id}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold">
                            <Eye className="h-4 w-4" /> {fr ? "Consulter" : "View"}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-400 text-right">{fr ? "Aperçu indisponible" : "No preview"}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </TechnicienLayout>
  );
}
