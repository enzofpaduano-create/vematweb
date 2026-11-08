import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, ClipboardCheck, Clock, FilePlus2, Loader2, Truck, Trash2 } from "lucide-react";
import { RapportLayout } from "./RapportLayout";
import { deleteDraft, listDrafts, saveDraft } from "@/lib/rapports/store";
import { sendIntervention } from "@/lib/rapports/api";
import type { InterventionDraft } from "@/lib/rapports/types";

const fmtWhen = (t: number) =>
  new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function RapportsHome() {
  const [, navigate] = useLocation();
  const [drafts, setDrafts] = useState<InterventionDraft[] | null>(null);
  const [flushing, setFlushing] = useState(false);
  const busy = useRef(false);
  const justSent = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("envoye") === "1";

  const refresh = useCallback(async () => {
    const all = await listDrafts().catch(() => []);
    // On ne garde que les 15 derniers envoyés sur l'appareil.
    const sent = all.filter((d) => d.status === "sent");
    await Promise.all(sent.slice(15).map((d) => deleteDraft(d.id).catch(() => undefined)));
    setDrafts(all.filter((d) => d.status !== "sent" || sent.indexOf(d) < 15));
  }, []);

  // Renvoie automatiquement les rapports restés en attente (réseau revenu, ouverture de l'application).
  const flush = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    busy.current = true;
    setFlushing(true);
    try {
      for (const d of (await listDrafts()).filter((x) => x.status === "queued")) {
        const res = await sendIntervention(d);
        if (res.ok) {
          await saveDraft({ ...d, status: "sent", sentAt: Date.now(), reportNo: res.reportNo, lastError: undefined, data: { ...d.data, photos: [], signatureTech: null, signatureClient: null } });
        } else {
          await saveDraft({ ...d, lastError: res.message, status: res.retry ? "queued" : "draft" });
        }
      }
    } finally {
      busy.current = false;
      setFlushing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh().then(flush);
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [refresh, flush]);

  const open = drafts?.filter((d) => d.status !== "sent") ?? [];
  const sent = drafts?.filter((d) => d.status === "sent") ?? [];

  return (
    <RapportLayout title="Mes rapports">
      {justSent && (
        <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-3 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> Rapport envoyé par e-mail.
        </p>
      )}

      <button
        type="button"
        onClick={() => navigate(`/espace-technicien/rapports/intervention/${crypto.randomUUID()}`)}
        className="w-full rounded-2xl bg-orange-500 text-white p-5 flex items-center gap-4 text-left mb-3 active:scale-[0.99] transition-transform"
      >
        <FilePlus2 className="w-8 h-8 shrink-0" />
        <span>
          <span className="block text-lg font-black leading-tight">Rapport d'intervention</span>
          <span className="block text-sm text-orange-100">Nouveau rapport avec photos et signatures</span>
        </span>
      </button>

      <div className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex items-center gap-4 text-left mb-6 opacity-60">
        <ClipboardCheck className="w-8 h-8 shrink-0 text-zinc-400" />
        <span>
          <span className="block text-lg font-black leading-tight text-zinc-300">Rapport d'inspection grue</span>
          <span className="block text-sm text-zinc-500">Bientôt disponible</span>
        </span>
      </div>

      {drafts === null ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <>
          {open.length > 0 && (
            <>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                À terminer / à envoyer {flushing && <Loader2 className="w-3 h-3 animate-spin" />}
              </h2>
              <div className="space-y-2 mb-6">
                {open.map((d) => (
                  <div key={d.id} className="flex items-stretch gap-2">
                    <Link href={`/espace-technicien/rapports/intervention/${d.id}`} className="flex-1 min-w-0 rounded-xl bg-zinc-900 border border-zinc-800 p-3.5 hover:border-orange-500/60">
                      <p className="font-bold truncate">{d.data.ficheNo ? `N° ${d.data.ficheNo} · ` : ""}{d.data.client || "Sans client"}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" /> {fmtWhen(d.updatedAt)} ·{" "}
                        {d.status === "queued" ? <span className="text-amber-400 font-semibold">En attente d'envoi</span> : "Brouillon"}
                      </p>
                      {d.lastError && <p className="text-xs text-red-400 mt-1">{d.lastError}</p>}
                    </Link>
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={async () => { if (confirm("Supprimer ce rapport non envoyé ?")) { await deleteDraft(d.id); refresh(); } }}
                      className="px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {sent.length > 0 && (
            <>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Envoyés</h2>
              <div className="space-y-2">
                {sent.map((d) => (
                  <div key={d.id} className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
                    <p className="font-semibold truncate flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-500 shrink-0" />{d.data.client}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Fiche N° {d.reportNo || d.data.ficheNo} · {fmtWhen(d.sentAt ?? d.updatedAt)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {open.length === 0 && sent.length === 0 && (
            <p className="text-center text-sm text-zinc-500 py-8">Aucun rapport pour le moment.</p>
          )}
        </>
      )}
    </RapportLayout>
  );
}
