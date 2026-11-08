import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, ImagePlus, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { RapportLayout } from "./RapportLayout";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import { deleteDraft, getDraft, saveDraft } from "@/lib/rapports/store";
import { compressImage } from "@/lib/rapports/image";
import { sendDraft } from "@/lib/rapports/api";
import { CHECKLIST, SCORE_LABEL, SCORE_ON, TOTAL_ROWS, sectionCounts, type ChecklistSection } from "@/lib/rapports/inspection";
import {
  MAX_AXLES, MAX_DEFECTS, MAX_PHOTOS, emptyInspection,
  type EngineInfo, type InspectionData, type InspectionDraft, type InspectionKind, type Score,
} from "@/lib/rapports/types";

const input =
  "w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-3 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500";

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 mb-4">
      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">{title}</h2>
      {hint && <p className="text-xs text-zinc-500 mb-3">{hint}</p>}
      <div className="space-y-3 mt-2">{children}</div>
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

const KINDS: { v: InspectionKind; label: string }[] = [
  { v: "inspection", label: "Inspection" },
  { v: "condition", label: "Condition" },
  { v: "final", label: "Contrôle final" },
];

function EngineForm({ value, onChange }: { value: EngineInfo; onChange: (v: EngineInfo) => void }) {
  const f = (key: keyof EngineInfo, label: string) => (
    <Field label={label}><input className={input} value={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.value })} autoComplete="off" /></Field>
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      {f("produit", "Produit")}{f("type", "Type")}{f("serie", "N° de série")}{f("cv", "CV / kW")}{f("rpm", "Tours / min")}{f("epa", "US EPA")}
    </div>
  );
}

function ChecklistSectionCard({
  s, scores, open, onToggle, onScore, onAllGood,
}: {
  s: ChecklistSection; scores: Record<string, Score>; open: boolean;
  onToggle: () => void; onScore: (id: string, v: Score | null) => void; onAllGood: () => void;
}) {
  const c = sectionCounts(s, scores);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-3.5 py-3 text-left" aria-expanded={open}>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-sm leading-tight">{s.title}</span>
          <span className="block text-[11px] text-zinc-500 mt-0.5">
            {c.done}/{c.total} contrôlés{c.bad > 0 && <span className="text-red-400 font-semibold"> · {c.bad} à traiter</span>}
          </span>
        </span>
        {c.done === c.total && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
        <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-800">
          {s.rows.map((r) => {
            const v = scores[r.id];
            return (
              <div key={r.id} className="px-3.5 py-2.5 border-b border-zinc-800/70 last:border-b-0">
                <p className="text-sm mb-1.5"><span className="text-zinc-500 text-xs mr-1.5">{r.code}</span>{r.label}</p>
                <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={r.label}>
                  {([1, 2, 3, 4] as Score[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onScore(r.id, v === n ? null : n)}
                      aria-pressed={v === n}
                      aria-label={`${r.label} : ${SCORE_LABEL[n]}`}
                      className={`h-11 rounded-lg border text-base font-black transition-colors ${v === n ? SCORE_ON[n] : "bg-zinc-900 border-zinc-700 text-zinc-400"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <button type="button" onClick={onAllGood} className="w-full py-3 text-xs font-bold text-emerald-400 hover:bg-zinc-900">
            Marquer les points non renseignés « 1 · Bonne condition »
          </button>
        </div>
      )}
    </div>
  );
}

export default function RapportInspection() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { technician } = useTechnicienAuth();
  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openSec, setOpenSec] = useState<string | null>(null);
  const loaded = useRef(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || loaded.current || !technician) return;
    loaded.current = true;
    (async () => {
      const existing = await getDraft(id).catch(() => undefined);
      if (existing?.kind === "inspection") {
        setDraft(existing);
        return;
      }
      setDraft({ id, kind: "inspection", status: "draft", updatedAt: Date.now(), data: emptyInspection(technician.name ?? "") });
    })();
  }, [id, technician]);

  // Sauvegarde automatique sur le téléphone
  useEffect(() => {
    if (!draft || draft.status === "sent") return;
    const t = setTimeout(() => { saveDraft(draft).catch(() => setNotice("Stockage du téléphone indisponible : ne fermez pas la page avant l'envoi.")); }, 500);
    return () => clearTimeout(t);
  }, [draft]);

  const data = draft?.data;
  const set = <K extends keyof InspectionData>(key: K, value: InspectionData[K]) =>
    setDraft((d) => (d ? { ...d, data: { ...d.data, [key]: value } } : d));
  const setScore = (rowId: string, v: Score | null) =>
    setDraft((d) => {
      if (!d) return d;
      const scores = { ...d.data.scores };
      if (v === null) delete scores[rowId]; else scores[rowId] = v;
      return { ...d, data: { ...d.data, scores } };
    });
  const allGood = (s: ChecklistSection) =>
    setDraft((d) => {
      if (!d) return d;
      const scores = { ...d.data.scores };
      for (const r of s.rows) if (!scores[r.id]) scores[r.id] = 1;
      return { ...d, data: { ...d.data, scores } };
    });

  const stats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<Score, number>;
    let done = 0;
    for (const v of Object.values(data?.scores ?? {})) { counts[v]++; done++; }
    return { counts, done };
  }, [data?.scores]);

  if (!draft || !data) {
    return (
      <RapportLayout title="Inspection grue" back="/espace-technicien/rapports">
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
        try { added.push({ id: crypto.randomUUID(), dataUrl: await compressImage(f), caption: "" }); } catch { /* fichier ignoré */ }
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
    if (!data.ficheNo.trim()) e.push("Renseignez le numéro de fiche de votre carnet.");
    if (!data.client.trim()) e.push("Renseignez le client.");
    if (!data.serie.trim()) e.push("Renseignez le numéro de série de la machine.");
    if (!stats.done) e.push("Aucun point de contrôle n'est noté.");
    return e;
  };

  const send = async () => {
    const e = validate();
    setErrors(e);
    setSendError(null);
    if (e.length) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (stats.done < TOTAL_ROWS && !confirm(`${TOTAL_ROWS - stats.done} point(s) de contrôle ne sont pas renseignés. Envoyer quand même ?`)) return;
    setSending(true);
    const queued: InspectionDraft = { ...draft, status: "queued", lastError: undefined };
    setDraft(queued);
    await saveDraft(queued).catch(() => undefined);
    const res = await sendDraft(queued);
    setSending(false);
    if (res.ok) {
      const done: InspectionDraft = { ...queued, status: "sent", sentAt: Date.now(), reportNo: res.reportNo, data: { ...queued.data, photos: [] } };
      await saveDraft(done).catch(() => undefined);
      navigate("/espace-technicien/rapports?envoye=1");
      return;
    }
    const failed: InspectionDraft = { ...queued, lastError: res.message, status: res.retry ? "queued" : "draft" };
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

  const checklistBlock = (pageId: "porteur" | "superstructure") => {
    const page = CHECKLIST.find((p) => p.id === pageId)!;
    return (
      <div className="space-y-2">
        {page.sections.map((s) => (
          <ChecklistSectionCard
            key={s.id}
            s={s}
            scores={data.scores}
            open={openSec === s.id}
            onToggle={() => setOpenSec(openSec === s.id ? null : s.id)}
            onScore={setScore}
            onAllGood={() => allGood(s)}
          />
        ))}
      </div>
    );
  };

  return (
    <RapportLayout title="Inspection grue" back="/espace-technicien/rapports">
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

      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 mb-4">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Points contrôlés</span><b className="text-white">{stats.done} / {TOTAL_ROWS}</b>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
          <div className="h-full bg-orange-500 transition-all" style={{ width: `${(stats.done / TOTAL_ROWS) * 100}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
          {([1, 2, 3, 4] as Score[]).map((n) => (
            <div key={n} className={`rounded-lg border py-1.5 ${SCORE_ON[n]}`}><b className="text-base">{stats.counts[n]}</b><br />{n}</div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">1 bonne condition · 2 moyenne · 3 erreur/défaut · 4 non contrôlable</p>
      </div>

      <Section title="Machine">
        <Field label="N° de fiche (celui de votre carnet)" required>
          <input className={`${input} text-xl font-bold tracking-wide`} value={data.ficheNo} onChange={(e) => set("ficheNo", e.target.value)} autoComplete="off" placeholder="ex. 1042" />
        </Field>
        <div>
          <span className="block text-xs font-semibold text-zinc-400 mb-1">Type de rapport</span>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button key={k.v} type="button" onClick={() => set("kind", k.v)} className={`py-3 rounded-xl text-sm font-bold border ${data.kind === k.v ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300"}`}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Client" required><input className={input} value={data.client} onChange={(e) => set("client", e.target.value)} autoComplete="off" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type de machine"><input className={input} value={data.type} onChange={(e) => set("type", e.target.value)} /></Field>
          <Field label="N° de série" required><input className={input} value={data.serie} onChange={(e) => set("serie", e.target.value)} autoComplete="off" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className={input} value={data.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="N° OT"><input className={input} value={data.ot} onChange={(e) => set("ot", e.target.value)} /></Field>
        </div>
        <Field label="Technicien"><input className={input} value={data.technicien} onChange={(e) => set("technicien", e.target.value)} /></Field>
        <Field label="Lieu"><input className={input} value={data.lieu} onChange={(e) => set("lieu", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kilométrage (porteur)"><input className={input} inputMode="numeric" value={data.km} onChange={(e) => set("km", e.target.value)} /></Field>
          <Field label="Heures (tourelle)"><input className={input} inputMode="decimal" value={data.hrs} onChange={(e) => set("hrs", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Porteur : contrôle" hint="Touchez une rubrique, puis la note de chaque point. Touchez la même note pour l'effacer.">
        {checklistBlock("porteur")}
      </Section>
      <Section title="Moteur porteur">
        <EngineForm value={data.moteurPorteur} onChange={(v) => set("moteurPorteur", v)} />
        <p className="text-xs text-zinc-500">Pensez à photographier la plaque moteur et l'étiquette EPA (section Photos).</p>
        <Field label="Commentaire porteur"><textarea className={`${input} min-h-[90px]`} value={data.commentairePorteur} onChange={(e) => set("commentairePorteur", e.target.value)} /></Field>
      </Section>

      <Section title="Superstructure (tourelle) : contrôle">
        {checklistBlock("superstructure")}
      </Section>
      <Section title="Moteur tourelle">
        <EngineForm value={data.moteurTourelle} onChange={(v) => set("moteurTourelle", v)} />
        <Field label="Commentaire tourelle"><textarea className={`${input} min-h-[90px]`} value={data.commentaireTourelle} onChange={(e) => set("commentaireTourelle", e.target.value)} /></Field>
      </Section>

      <Section title={`Liste des défauts (${data.defauts.length})`} hint="Un défaut par ligne : ce qui est à réparer ou à surveiller.">
        {data.defauts.map((d, i) => (
          <div key={d.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
            <div className="flex gap-2">
              {(["porteur", "tourelle"] as const).map((z) => (
                <button key={z} type="button" onClick={() => set("defauts", data.defauts.map((x) => (x.id === d.id ? { ...x, zone: z } : x)))} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${d.zone === z ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300"}`}>
                  {z === "porteur" ? "Porteur" : "Tourelle"}
                </button>
              ))}
              <button type="button" aria-label={`Supprimer le défaut ${i + 1}`} onClick={() => set("defauts", data.defauts.filter((x) => x.id !== d.id))} className="px-3 rounded-lg text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
            <input className={input} placeholder="Description du défaut" value={d.description} maxLength={300} onChange={(e) => set("defauts", data.defauts.map((x) => (x.id === d.id ? { ...x, description: e.target.value } : x)))} />
            <input className={`${input} !py-2 text-sm`} placeholder="Commentaire (facultatif)" value={d.commentaire} maxLength={300} onChange={(e) => set("defauts", data.defauts.map((x) => (x.id === d.id ? { ...x, commentaire: e.target.value } : x)))} />
          </div>
        ))}
        {data.defauts.length < MAX_DEFECTS && (
          <button type="button" onClick={() => set("defauts", [...data.defauts, { id: crypto.randomUUID(), zone: "porteur", description: "", commentaire: "" }])} className="w-full py-3 rounded-xl border border-dashed border-zinc-600 text-zinc-300 text-sm font-semibold flex items-center justify-center gap-2 hover:border-orange-500">
            <Plus className="w-4 h-4" /> Ajouter un défaut
          </button>
        )}
      </Section>

      <Section title="Jeu de couronne (facultatif)" hint="Mesure au comparateur, en 0,01 mm, 3 essais par point. Voir la procédure dans le modèle Excel.">
        {data.couronne.map((m, i) => (
          <div key={i}>
            <span className="block text-xs font-semibold text-zinc-400 mb-1">Point de mesure {i + 1}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["t1", "t2", "t3"] as const).map((k, n) => (
                <input key={k} className={`${input} text-center`} inputMode="decimal" placeholder={`Essai ${n + 1}`} value={m[k]} onChange={(e) => set("couronne", data.couronne.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Pneus (facultatif)" hint="Un essieu par ligne : gauche et droite. Usure en %.">
        {data.pneus.map((a, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Essieu {i + 1}</p>
              {i === data.pneus.length - 1 && (
                <button type="button" aria-label="Retirer le dernier essieu" onClick={() => set("pneus", data.pneus.slice(0, -1))} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            {([["Gauche", "g"], ["Droite", "d"]] as const).map(([label, p]) => (
              <div key={p}>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
                <div className="grid grid-cols-3 gap-2">
                  <input className={`${input} !px-2.5 text-sm`} placeholder="Marque" value={a[`${p}Marque` as const]} onChange={(e) => set("pneus", data.pneus.map((x, j) => (j === i ? { ...x, [`${p}Marque`]: e.target.value } : x)))} />
                  <input className={`${input} !px-2.5 text-sm`} placeholder="Dimensions" value={a[`${p}Dim` as const]} onChange={(e) => set("pneus", data.pneus.map((x, j) => (j === i ? { ...x, [`${p}Dim`]: e.target.value } : x)))} />
                  <input className={`${input} !px-2.5 text-sm`} placeholder="Usure %" inputMode="decimal" value={a[`${p}Usure` as const]} onChange={(e) => set("pneus", data.pneus.map((x, j) => (j === i ? { ...x, [`${p}Usure`]: e.target.value } : x)))} />
                </div>
              </div>
            ))}
          </div>
        ))}
        {data.pneus.length < MAX_AXLES && (
          <button type="button" onClick={() => set("pneus", [...data.pneus, { gMarque: "", gDim: "", gUsure: "", dMarque: "", dDim: "", dUsure: "" }])} className="w-full py-3 rounded-xl border border-dashed border-zinc-600 text-zinc-300 text-sm font-semibold flex items-center justify-center gap-2 hover:border-orange-500">
            <Plus className="w-4 h-4" /> Ajouter l'essieu {data.pneus.length + 1}
          </button>
        )}
        {data.pneus.length > 0 && (
          <Field label="Commentaire pneus"><textarea className={`${input} min-h-[70px]`} value={data.pneusCommentaire} onChange={(e) => set("pneusCommentaire", e.target.value)} /></Field>
        )}
      </Section>

      <Section title={`Photos (${data.photos.length}/${MAX_PHOTOS})`} hint="Plaque moteur, étiquette EPA, défauts constatés…">
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
              <input className={`${input} !py-2 text-sm`} placeholder={`Légende photo ${i + 1}`} value={p.caption} maxLength={160} onChange={(e) => set("photos", data.photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))} />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["Plaque moteur porteur", "EPA porteur", "Plaque moteur tourelle", "EPA tourelle"].map((c) => (
                  <button key={c} type="button" onClick={() => set("photos", data.photos.map((x) => (x.id === p.id ? { ...x, caption: c } : x)))} className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">{c}</button>
                ))}
              </div>
              <button type="button" onClick={() => set("photos", data.photos.filter((x) => x.id !== p.id))} className="mt-2 text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Retirer</button>
            </div>
          </div>
        ))}
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
