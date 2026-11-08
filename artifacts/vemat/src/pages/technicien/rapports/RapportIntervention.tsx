import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Camera, ImagePlus, Loader2, Plus, Send, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RapportLayout } from "./RapportLayout";
import { SignaturePad } from "./SignaturePad";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import { deleteDraft, getDraft, loadPref, saveDraft, savePref } from "@/lib/rapports/store";
import { compressImage } from "@/lib/rapports/image";
import { sendIntervention } from "@/lib/rapports/api";
import { fmtMinutes, slotError, travelMinutes, workMinutes } from "@/lib/rapports/time";
import {
  MAX_PHOTOS, MAX_ROWS, emptyIntervention, emptyRow, todayIso,
  type InterventionData, type InterventionDraft, type TimeRow,
} from "@/lib/rapports/types";

const input =
  "w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-3 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 mb-4">
      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-zinc-400 mb-1">
        {label}{required && <span className="text-orange-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  const btn = (on: boolean, text: string, v: boolean) => (
    <button
      type="button"
      onClick={() => onChange(value === v ? null : v)}
      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
        on ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300"
      }`}
    >
      {text}
    </button>
  );
  return (
    <div>
      <span className="block text-xs font-semibold text-zinc-400 mb-1">{label}</span>
      <div className="flex gap-2">{btn(value === true, "Oui", true)}{btn(value === false, "Non", false)}</div>
    </div>
  );
}

function TimeSlot({ label, from, to, onFrom, onTo }: { label: string; from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  const bad = slotError(from, to);
  return (
    <div>
      <span className="block text-[11px] text-zinc-500 mb-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="time" value={from} onChange={(e) => onFrom(e.target.value)} className={`${input} !px-2 !py-2.5 text-center ${bad ? "!border-red-500" : ""}`} aria-label={`${label} début`} />
        <span className="text-zinc-600">→</span>
        <input type="time" value={to} onChange={(e) => onTo(e.target.value)} className={`${input} !px-2 !py-2.5 text-center ${bad ? "!border-red-500" : ""}`} aria-label={`${label} fin`} />
      </div>
    </div>
  );
}

export default function RapportIntervention() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { technician } = useTechnicienAuth();
  const [draft, setDraft] = useState<InterventionDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const loaded = useRef(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  // Chargement (ou création) du brouillon
  useEffect(() => {
    if (!id || loaded.current || !technician) return;
    loaded.current = true;
    (async () => {
      const existing = await getDraft(id).catch(() => undefined);
      if (existing) {
        setDraft(existing);
        return;
      }
      setDraft({
        id,
        kind: "intervention",
        status: "draft",
        updatedAt: Date.now(),
        data: emptyIntervention(technician.name ?? "", loadPref("vehicule")),
      });
    })();
  }, [id, technician]);

  // Sauvegarde automatique (anti-perte : batterie, appel téléphonique, retour au navigateur…)
  useEffect(() => {
    if (!draft || draft.status === "sent") return;
    const t = setTimeout(() => { saveDraft(draft).catch(() => setNotice("Stockage du téléphone indisponible : ne fermez pas la page avant l'envoi.")); }, 500);
    return () => clearTimeout(t);
  }, [draft]);

  const data = draft?.data;
  const set = <K extends keyof InterventionData>(key: K, value: InterventionData[K]) =>
    setDraft((d) => (d ? { ...d, data: { ...d.data, [key]: value } } : d));
  const setRow = (i: number, patch: Partial<TimeRow>) =>
    setDraft((d) => (d ? { ...d, data: { ...d.data, rows: d.data.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) } } : d));

  const totals = useMemo(
    () => ({
      travel: (data?.rows ?? []).reduce((s, r) => s + travelMinutes(r), 0),
      work: (data?.rows ?? []).reduce((s, r) => s + workMinutes(r), 0),
    }),
    [data?.rows],
  );

  if (!draft || !data) {
    return (
      <RapportLayout title="Rapport d'intervention" back="/espace-technicien/rapports">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      </RapportLayout>
    );
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setPhotoBusy(true);
    try {
      const room = MAX_PHOTOS - data.photos.length;
      const added = [];
      for (const f of Array.from(files).slice(0, Math.max(0, room))) {
        try {
          added.push({ id: crypto.randomUUID(), dataUrl: await compressImage(f), caption: "" });
        } catch { /* fichier ignoré */ }
      }
      if (files.length > room) setNotice(`Maximum ${MAX_PHOTOS} photos par rapport.`);
      set("photos", [...data.photos, ...added]);
    } finally {
      setPhotoBusy(false);
      if (camRef.current) camRef.current.value = "";
      if (galRef.current) galRef.current.value = "";
    }
  };

  const validate = (): string[] => {
    const e: string[] = [];
    if (!data.client.trim()) e.push("Renseignez le client.");
    if (!data.detail.trim()) e.push("Décrivez le détail du travail.");
    data.rows.forEach((r, i) => {
      const bad = slotError(r.voyMatinDeb, r.voyMatinFin) || slotError(r.voySoirDeb, r.voySoirFin) || slotError(r.travMatinDeb, r.travMatinFin) || slotError(r.travSoirDeb, r.travSoirFin);
      if (bad) e.push(`Jour ${i + 1} : une heure de début ou de fin est manquante ou incohérente.`);
      if (!r.date) e.push(`Jour ${i + 1} : date manquante.`);
    });
    if (!data.signatureTech) e.push("Signature du technicien manquante.");
    return e;
  };

  const send = async () => {
    const e = validate();
    setErrors(e);
    setSendError(null);
    if (e.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    savePref("vehicule", data.vehicule);
    setSending(true);
    const queued: InterventionDraft = { ...draft, status: "queued", lastError: undefined };
    setDraft(queued);
    await saveDraft(queued).catch(() => undefined);
    const res = await sendIntervention(queued);
    setSending(false);
    if (res.ok) {
      // Photos et signatures retirées du téléphone une fois parties (place disque), le texte est gardé pour l'historique.
      const done: InterventionDraft = {
        ...queued,
        status: "sent",
        sentAt: Date.now(),
        reportNo: res.reportNo,
        data: { ...queued.data, photos: [], signatureTech: null, signatureClient: null },
      };
      await saveDraft(done).catch(() => undefined);
      navigate("/espace-technicien/rapports?envoye=1");
      return;
    }
    const failed: InterventionDraft = { ...queued, lastError: res.message, status: res.retry ? "queued" : "draft" };
    setDraft(failed);
    await saveDraft(failed).catch(() => undefined);
    setSendError(res.message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async () => {
    if (!confirm("Supprimer ce brouillon ?")) return;
    await deleteDraft(draft.id).catch(() => undefined);
    navigate("/espace-technicien/rapports");
  };

  return (
    <RapportLayout title="Rapport d'intervention" back="/espace-technicien/rapports">
      {notice && <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">{notice}</p>}
      {sendError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-3 mb-4 text-sm text-red-300">
          <p className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Rapport non envoyé</p>
          <p>{sendError}</p>
          {draft.status === "queued" && <p className="text-red-200/80 mt-1">Il est conservé sur le téléphone : réessayez dès que vous avez du réseau.</p>}
        </div>
      )}
      {draft.status === "queued" && !errors.length && !sendError && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
          Ce rapport est prêt mais pas encore envoyé. Appuyez sur « Envoyer » pour réessayer.
        </p>
      )}
      {errors.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-3 mb-4 text-sm text-red-300">
          <p className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> À corriger avant l'envoi</p>
          <ul className="list-disc pl-5 space-y-0.5">{errors.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}

      <Section title="Intervention">
        <Field label="Client" required><input className={input} value={data.client} onChange={(e) => set("client", e.target.value)} autoComplete="off" /></Field>
        <Field label="Chantier"><input className={input} value={data.chantier} onChange={(e) => set("chantier", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact"><input className={input} value={data.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
          <Field label="Téléphone"><input className={input} type="tel" inputMode="tel" value={data.tel} onChange={(e) => set("tel", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Modèle"><input className={input} value={data.modele} onChange={(e) => set("modele", e.target.value)} /></Field>
          <Field label="N° de série"><input className={input} value={data.serie} onChange={(e) => set("serie", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Compteur horaire"><input className={input} inputMode="decimal" value={data.comptHr} onChange={(e) => set("comptHr", e.target.value)} /></Field>
          <Field label="N° OT"><input className={input} value={data.otNo} onChange={(e) => set("otNo", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Technicien"><input className={input} value={data.technicien} onChange={(e) => set("technicien", e.target.value)} /></Field>
          <Field label="Véhicule"><input className={input} value={data.vehicule} onChange={(e) => set("vehicule", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Travaux">
        <Field label="Nature de l'intervention">
          <textarea className={`${input} min-h-[90px]`} value={data.nature} onChange={(e) => set("nature", e.target.value)} />
        </Field>
        <Field label="Détail du travail" required>
          <textarea className={`${input} min-h-[180px]`} value={data.detail} onChange={(e) => set("detail", e.target.value)} />
        </Field>
      </Section>

      <Section title="Horaires">
        {data.rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label={`Jour ${i + 1}`}><input type="date" className={input} value={r.date} onChange={(e) => setRow(i, { date: e.target.value })} /></Field>
              </div>
              {data.rows.length > 1 && (
                <button type="button" aria-label="Supprimer ce jour" onClick={() => set("rows", data.rows.filter((_, k) => k !== i))} className="p-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Voyage / préparation</p>
            <div className="grid grid-cols-1 gap-2">
              <TimeSlot label="Matin" from={r.voyMatinDeb} to={r.voyMatinFin} onFrom={(v) => setRow(i, { voyMatinDeb: v })} onTo={(v) => setRow(i, { voyMatinFin: v })} />
              <TimeSlot label="Soir" from={r.voySoirDeb} to={r.voySoirFin} onFrom={(v) => setRow(i, { voySoirDeb: v })} onTo={(v) => setRow(i, { voySoirFin: v })} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Travail</p>
            <div className="grid grid-cols-1 gap-2">
              <TimeSlot label="Matin" from={r.travMatinDeb} to={r.travMatinFin} onFrom={(v) => setRow(i, { travMatinDeb: v })} onTo={(v) => setRow(i, { travMatinFin: v })} />
              <TimeSlot label="Soir" from={r.travSoirDeb} to={r.travSoirFin} onFrom={(v) => setRow(i, { travSoirDeb: v })} onTo={(v) => setRow(i, { travSoirFin: v })} />
            </div>
            <p className="text-xs text-zinc-400">Voyage {fmtMinutes(travelMinutes(r))} · Travail <b className="text-white">{fmtMinutes(workMinutes(r))}</b></p>
          </div>
        ))}
        {data.rows.length < MAX_ROWS && (
          <button
            type="button"
            onClick={() => {
              const last = data.rows[data.rows.length - 1]?.date || todayIso();
              const d = new Date(`${last}T12:00:00`);
              d.setDate(d.getDate() + 1);
              set("rows", [...data.rows, emptyRow(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)]);
            }}
            className="w-full py-3 rounded-xl border border-dashed border-zinc-600 text-zinc-300 text-sm font-semibold flex items-center justify-center gap-2 hover:border-orange-500"
          >
            <Plus className="w-4 h-4" /> Ajouter un jour
          </button>
        )}
        <div className="flex justify-between text-sm bg-zinc-950 rounded-xl px-4 py-3 border border-zinc-800">
          <span className="text-zinc-400">Cumul voyage <b className="text-white">{fmtMinutes(totals.travel)}</b></span>
          <span className="text-zinc-400">Cumul travail <b className="text-orange-400">{fmtMinutes(totals.work)}</b></span>
        </div>
      </Section>

      <Section title="Séjour">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Repas"><input className={input} inputMode="numeric" value={data.repas} onChange={(e) => set("repas", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Nuits"><input className={input} inputMode="numeric" value={data.nuits} onChange={(e) => set("nuits", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Km"><input className={input} inputMode="numeric" value={data.km} onChange={(e) => set("km", e.target.value.replace(/\D/g, ""))} /></Field>
        </div>
      </Section>

      <Section title="Suivi">
        <YesNo label="Garantie" value={data.garantie} onChange={(v) => set("garantie", v)} />
        <YesNo label="Fournitures" value={data.fournitures} onChange={(v) => set("fournitures", v)} />
        <YesNo label="Travaux restants" value={data.travauxRestant} onChange={(v) => set("travauxRestant", v)} />
        {data.travauxRestant === true && (
          <Field label="Travaux restant à faire">
            <textarea className={`${input} min-h-[110px]`} value={data.travauxRestantDetail} onChange={(e) => set("travauxRestantDetail", e.target.value)} />
          </Field>
        )}
      </Section>

      <Section title={`Photos (${data.photos.length}/${MAX_PHOTOS})`}>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={photoBusy} onClick={() => camRef.current?.click()} className="py-4 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {photoBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />} Photo
          </button>
          <button type="button" disabled={photoBusy} onClick={() => galRef.current?.click()} className="py-4 rounded-xl bg-zinc-800 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <ImagePlus className="w-5 h-5" /> Galerie
          </button>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhotos(e.target.files)} />
        <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
        {data.photos.map((p, i) => (
          <div key={p.id} className="flex gap-3 items-start rounded-xl bg-zinc-950 border border-zinc-800 p-2">
            <img src={p.dataUrl} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <input
                className={`${input} !py-2 text-sm`}
                placeholder={`Légende photo ${i + 1}`}
                value={p.caption}
                maxLength={160}
                onChange={(e) => set("photos", data.photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
              />
              <button type="button" onClick={() => set("photos", data.photos.filter((x) => x.id !== p.id))} className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Retirer
              </button>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Signatures">
        <SignaturePad label="Technicien" value={data.signatureTech} onChange={(v) => set("signatureTech", v)} />
        <SignaturePad label="Client" value={data.signatureClient} onChange={(v) => set("signatureClient", v)} />
      </Section>

      <button type="button" onClick={remove} className="w-full text-sm text-zinc-500 hover:text-red-400 py-3">Supprimer ce brouillon</button>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-3 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <p className="text-[11px] text-zinc-500 flex-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Enregistré automatiquement sur le téléphone</p>
          <button type="button" onClick={send} disabled={sending} className="px-6 py-3.5 rounded-xl bg-orange-500 text-white font-black text-base flex items-center gap-2 disabled:opacity-60">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </RapportLayout>
  );
}
