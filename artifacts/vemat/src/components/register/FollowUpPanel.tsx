import { useMemo, useState } from "react";
import { BellRing, Check, Copy, Loader2, Mail, X } from "lucide-react";
import {
  CHASE_AFTER_DAYS, addEvent, chaseDraft, daysWaiting, needsChase, updateRequest,
  type RegisterRow,
} from "@/lib/quotationRegister";
import { INPUT_CLS, type RegisterPortal } from "./registerContext";

function isoPlusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function DraftDialog({
  ctx, row, onClose, onDone,
}: { ctx: RegisterPortal; row: RegisterRow; onClose: () => void; onDone: () => void }) {
  const initial = useMemo(() => chaseDraft(row), [row]);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accent } = ctx;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed: select the text and copy it manually.");
    }
  };

  const mailto = row.contact_email
    ? `mailto:${encodeURIComponent(row.contact_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  const markDone = async () => {
    setBusy(true); setError(null);
    try {
      await updateRequest(ctx.sb, row.id, { next_follow_up_at: isoPlusDays(CHASE_AFTER_DAYS) });
      await addEvent(ctx.sb, row.id, "follow_up", `Follow-up sent to the client (next one in ${CHASE_AFTER_DAYS} days).`, ctx.userEmail);
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-zinc-950">Follow-up draft</h3>
            <p className="text-xs text-zinc-500">
              {row.client_name} · {row.quotation_ref || row.request_id}. Nothing is sent from here: copy it or open it in your mail app, then mark it as done.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
        </div>
        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">To</label>
        <p className="text-sm text-zinc-700 mb-3">{row.contact_email || <span className="text-amber-600">No contact e-mail on this request</span>}</p>
        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Subject</label>
        <input className={`${INPUT_CLS} ${accent.ring} mb-3`} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Message</label>
        <textarea className={`${INPUT_CLS} ${accent.ring} h-64 font-sans`} value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={copy} className="inline-flex items-center gap-2 text-sm font-bold border border-zinc-200 rounded-xl px-3 py-2 hover:bg-zinc-50">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
          </button>
          {mailto && (
            <a href={mailto} className="inline-flex items-center gap-2 text-sm font-bold border border-zinc-200 rounded-xl px-3 py-2 hover:bg-zinc-50">
              <Mail className="w-4 h-4" /> Open in mail app
            </a>
          )}
          <button onClick={markDone} disabled={busy} className={`ml-auto inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2 disabled:opacity-60 ${accent.solid}`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Mark as followed up
          </button>
        </div>
      </div>
    </div>
  );
}

export function FollowUpPanel({
  ctx, rows, onChanged,
}: { ctx: RegisterPortal; rows: RegisterRow[]; onChanged: () => void }) {
  const [draftFor, setDraftFor] = useState<RegisterRow | null>(null);
  const chase = useMemo(
    () => rows.filter((r) => needsChase(r)).sort((a, b) => (daysWaiting(b) ?? 0) - (daysWaiting(a) ?? 0)),
    [rows],
  );
  if (chase.length === 0) return null;

  return (
    <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BellRing className="w-4 h-4 text-amber-600" />
        <h2 className="text-sm font-black text-zinc-950">Quotes to follow up</h2>
        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{chase.length}</span>
        <span className="text-xs text-zinc-500">sent {CHASE_AFTER_DAYS}+ days ago, no answer from the client yet</span>
      </div>
      <ul className="divide-y divide-amber-100">
        {chase.map((r) => (
          <li key={r.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-sm text-zinc-900 min-w-[160px]">{r.client_name}</span>
            <span className="font-mono text-xs text-zinc-600">{r.quotation_ref || r.request_id}</span>
            <span className="text-xs text-zinc-500 tabular-nums">
              {r.total_quote_amount != null
                ? `${Number(r.total_quote_amount).toLocaleString("en-GB", { maximumFractionDigits: 2 })} ${r.currency ?? ""}`
                : "—"}
            </span>
            <span className="text-xs font-bold text-amber-700">{daysWaiting(r)} days waiting</span>
            <button onClick={() => setDraftFor(r)} className={`ml-auto text-xs font-bold rounded-lg px-3 py-1.5 ${ctx.accent.solid}`}>
              Draft follow-up
            </button>
          </li>
        ))}
      </ul>
      {draftFor && (
        <DraftDialog ctx={ctx} row={draftFor} onClose={() => setDraftFor(null)}
          onDone={() => { setDraftFor(null); onChanged(); }} />
      )}
    </section>
  );
}
