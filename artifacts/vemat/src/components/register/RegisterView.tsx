import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Loader2, Plus, RefreshCw, Search, X } from "lucide-react";
import {
  listRegister, computeRegisterKpis, exportRegisterXlsx,
  REQUEST_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_COLOR, STAGE_LABEL, STAGE_COLOR, GM_LABEL, COMMERCIAL_LABEL,
  OPEN_STAGES, blockingReason,
  type RegisterRow, type RegisterStage, type RequestType, type RequestPriority,
} from "@/lib/quotationRegister";
import { INPUT_CLS, type RegisterPortal } from "./registerContext";
import { NewRequestDialog } from "./NewRequestDialog";
import { RequestPanel } from "./RequestPanel";

// ── Blocs de colonnes (mêmes 7 blocs que le fichier Excel d'origine) ─────────

export type BlockKey = "intake" | "scope" | "priority" | "costing" | "dg" | "commercial" | "remarks";
const BLOCK_TITLE: Record<BlockKey, string> = {
  intake: "1 · Intake & client", scope: "2 · Technical scope", priority: "3 · Priority", costing: "4 · Costing",
  dg: "5 · DG review", commercial: "6 · Commercial", remarks: "7 · Remarks",
};
const BLOCK_ORDER: BlockKey[] = ["intake", "scope", "priority", "costing", "dg", "commercial", "remarks"];

function d(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB") : "—";
}
function money(r: RegisterRow): string {
  return r.total_quote_amount != null
    ? Number(r.total_quote_amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

interface Col { header: string; block: BlockKey; cell: (r: RegisterRow) => React.ReactNode; className?: string }
const COLS: Col[] = [
  { header: "Request ID", block: "intake", cell: (r) => <span className="font-mono font-black text-zinc-950">{r.request_id}</span> },
  { header: "Date Received", block: "intake", cell: (r) => d(r.date_received) },
  { header: "Client Name", block: "intake", cell: (r) => <span className="font-semibold">{r.client_name}</span>, className: "min-w-[170px]" },
  { header: "Location / Site", block: "intake", cell: (r) => r.location_site || "—" },
  { header: "Equipment / Machine", block: "scope", cell: (r) => r.equipment || "—", className: "min-w-[150px]" },
  { header: "Serial Number", block: "scope", cell: (r) => r.serial_number || "—" },
  { header: "Request Type", block: "scope", cell: (r) => REQUEST_TYPE_LABEL[r.request_type] },
  {
    header: "Priority", block: "priority",
    cell: (r) => <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${PRIORITY_COLOR[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span>,
  },
  { header: "Quotation Ref No.", block: "costing", cell: (r) => (r.quotation_ref ? <span className="font-mono font-bold">{r.quotation_ref}</span> : (r.pdr_document_id || r.sav_document_id) ? <span className="text-amber-600 font-semibold text-xs">To enter</span> : <span className="text-zinc-400">—</span>) },
  { header: "Date Prepared", block: "costing", cell: (r) => d(r.date_prepared) },
  { header: "Total Quote Amount", block: "costing", cell: (r) => <span className="tabular-nums">{money(r)} {r.total_quote_amount != null ? r.currency : ""}</span>, className: "text-right" },
  { header: "GM Approval Status", block: "dg", cell: (r) => (r.gm_approval_status ? GM_LABEL[r.gm_approval_status] : "—") },
  { header: "Date Approved", block: "dg", cell: (r) => d(r.date_approved) },
  { header: "Sent to Client", block: "commercial", cell: (r) => d(r.sent_to_client_at) },
  { header: "Commercial Status", block: "commercial", cell: (r) => (r.commercial_status ? COMMERCIAL_LABEL[r.commercial_status] ?? r.commercial_status : "—") },
  { header: "PO / WO No.", block: "commercial", cell: (r) => r.po_wo_no || "—" },
  { header: "Remarks", block: "remarks", cell: (r) => <span className="line-clamp-2">{r.remarks || "—"}</span>, className: "min-w-[180px]" },
];

// ── Indicateurs ─────────────────────────────────────────────────────────────

function Tile({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "warn" | "good" | "bad" }) {
  const toneCls = tone === "warn" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-zinc-950";
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${toneCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function RegisterKpiTiles({ rows }: { rows: RegisterRow[] }) {
  const k = useMemo(() => computeRegisterKpis(rows), [rows]);
  const pipe = Object.entries(k.pipeline);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      <Tile label="Requests" value={k.total} />
      <Tile label="To be costed" value={k.toCost} tone={k.toCost > 0 ? "warn" : undefined} sub="not yet at the DG" />
      <Tile label="Waiting for DG" value={k.pendingDg} tone={k.pendingDg > 0 ? "warn" : undefined} />
      <Tile
        label="Sent · open" value={k.sent}
        sub={pipe.length === 0 ? "no amount yet" : pipe.map(([c, v]) => `${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })} ${c}`).join(" · ")}
      />
      <Tile label="Won" value={k.won} tone="good" sub={k.conversion != null ? `${k.conversion}% of quotes sent` : undefined} />
      <Tile label="Blocked" value={k.blocked} tone={k.blocked > 0 ? "bad" : undefined} sub="information missing / revision" />
      <Tile label="Overdue" value={k.overdue} tone={k.overdue > 0 ? "bad" : undefined} sub={k.avgDaysToSend != null ? `avg. ${k.avgDaysToSend} d to send` : "2+ days, not sent"} />
    </div>
  );
}

// ── Tableau (présentationnel : reçoit les lignes déjà filtrées) ─────────────

export function RegisterTable({
  rows, hidden, onOpen, selectedId,
}: { rows: RegisterRow[]; hidden: Set<BlockKey>; onOpen: (r: RegisterRow) => void; selectedId?: string | null }) {
  const cols = COLS.filter((c) => !hidden.has(c.block));
  const blocks = BLOCK_ORDER.filter((b) => !hidden.has(b));
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#D9E2F8]">
            <th className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#3C5E8F] text-left" colSpan={1}>Status</th>
            {blocks.map((b) => (
              <th key={b} colSpan={COLS.filter((c) => c.block === b).length}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#3C5E8F] text-center border-l border-white whitespace-nowrap">
                {BLOCK_TITLE[b]}
              </th>
            ))}
          </tr>
          <tr className="bg-[#3C5E8F] text-white">
            <th className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap">Stage / blocking point</th>
            {cols.map((c) => <th key={c.header} className={`px-3 py-2 text-left text-xs font-bold whitespace-nowrap ${c.className?.includes("text-right") ? "text-right" : ""}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length + 1} className="px-4 py-10 text-center text-zinc-400">No request matches these filters.</td></tr>
          )}
          {rows.map((r) => {
            const bg = r.stage === "won" ? "bg-[#EFF8F1]" : r.stage === "revision_requested" ? "bg-[#FFF8E0]" : "bg-white";
            const reason = blockingReason(r);
            return (
              <tr key={r.id} onClick={() => onOpen(r)}
                className={`${bg} border-t border-zinc-100 cursor-pointer hover:bg-sky-50/60 ${selectedId === r.id ? "outline outline-2 -outline-offset-2 outline-sky-400" : ""}`}>
                <td className="px-3 py-2 align-top min-w-[210px]">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded ${STAGE_COLOR[r.stage]}`}>{STAGE_LABEL[r.stage]}</span>
                  {(r.is_blocked || r.is_overdue) && (
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-red-600 font-semibold leading-tight">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                      <span>{r.is_overdue ? `${r.days_open} days open · ` : ""}{reason ?? "Overdue"}</span>
                    </p>
                  )}
                </td>
                {cols.map((c) => (
                  <td key={c.header} className={`px-3 py-2 align-top text-zinc-700 ${c.className?.includes("min-w") ? "" : "whitespace-nowrap"} ${c.className ?? ""}`}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Écran complet ───────────────────────────────────────────────────────────

type StageFilter = "all" | "open" | RegisterStage;

export default function RegisterView({ ctx }: { ctx: RegisterPortal }) {
  const { sb, accent } = ctx;
  const [rows, setRows] = useState<RegisterRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<RequestType | "all">("all");
  const [stage, setStage] = useState<StageFilter>("all");
  const [priority, setPriority] = useState<RequestPriority | "all">("all");
  const [client, setClient] = useState("all");
  const [owner, setOwner] = useState("all");
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [hidden, setHidden] = useState<Set<BlockKey>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listRegister(sb)); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  const clients = useMemo(() => [...new Set((rows ?? []).map((r) => r.client_name))].sort(), [rows]);
  const owners = useMemo(() => [...new Set((rows ?? []).map((r) => r.costing_owner).filter(Boolean) as string[])].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (type !== "all" && r.request_type !== type) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (client !== "all" && r.client_name !== client) return false;
      if (owner !== "all" && r.costing_owner !== owner) return false;
      if (stage === "open" && !OPEN_STAGES.includes(r.stage)) return false;
      if (stage !== "all" && stage !== "open" && r.stage !== stage) return false;
      if (onlyBlocked && !r.is_blocked) return false;
      if (onlyOverdue && !r.is_overdue) return false;
      if (q) {
        const hay = [r.request_id, r.client_name, r.quotation_ref, r.equipment, r.serial_number, r.location_site, r.po_wo_no, r.remarks, r.missing_info]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, type, stage, priority, client, owner, onlyBlocked, onlyOverdue]);

  const selected = useMemo(() => (rows ?? []).find((r) => r.id === selectedId) ?? null, [rows, selectedId]);
  const filtersActive = query || type !== "all" || stage !== "all" || priority !== "all" || client !== "all" || owner !== "all" || onlyBlocked || onlyOverdue;

  function resetFilters() {
    setQuery(""); setType("all"); setStage("all"); setPriority("all"); setClient("all"); setOwner("all");
    setOnlyBlocked(false); setOnlyOverdue(false);
  }
  function toggleBlock(b: BlockKey) {
    setHidden((prev) => { const n = new Set(prev); if (n.has(b)) n.delete(b); else n.add(b); return n; });
  }
  async function handleExport() {
    setExporting(true);
    try { await exportRegisterXlsx(filtered); } catch (e) { setError((e as Error).message); }
    finally { setExporting(false); }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">Quotation register</h1>
          <p className="text-sm text-zinc-500">Vemat Westchase · every quote request, from intake to the client's answer. Shared by the PDR and SAV portals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50" title="Refresh" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleExport} disabled={exporting || !rows?.length}
            className="inline-flex items-center gap-2 text-sm font-bold border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl px-3 py-2 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Excel
          </button>
          <button onClick={() => setShowNew(true)} className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 ${accent.solid}`}>
            <Plus className="w-4 h-4" /> New request
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {rows === null ? (
        <div className="py-20 flex justify-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <RegisterKpiTiles rows={rows} />

          {/* Filtres */}
          <div className="mt-5 mb-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className={`${INPUT_CLS} ${accent.ring} pl-9 w-60`} placeholder="Search ID, client, DE26…, serial…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className={`${INPUT_CLS} ${accent.ring} w-auto`} value={stage} onChange={(e) => setStage(e.target.value as StageFilter)} aria-label="Stage">
              <option value="all">All stages</option>
              <option value="open">Open only</option>
              {(Object.keys(STAGE_LABEL) as RegisterStage[]).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
            <select className={`${INPUT_CLS} ${accent.ring} w-auto`} value={type} onChange={(e) => setType(e.target.value as RequestType | "all")} aria-label="Request type">
              <option value="all">All types</option>
              {(Object.keys(REQUEST_TYPE_LABEL) as RequestType[]).map((t) => <option key={t} value={t}>{REQUEST_TYPE_LABEL[t]}</option>)}
            </select>
            <select className={`${INPUT_CLS} ${accent.ring} w-auto max-w-[200px]`} value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client">
              <option value="all">All clients</option>
              {clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`${INPUT_CLS} ${accent.ring} w-auto`} value={priority} onChange={(e) => setPriority(e.target.value as RequestPriority | "all")} aria-label="Priority">
              <option value="all">All priorities</option>
              {(Object.keys(PRIORITY_LABEL) as RequestPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
            {owners.length > 0 && (
              <select className={`${INPUT_CLS} ${accent.ring} w-auto`} value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Costing owner">
                <option value="all">All costing owners</option>
                {owners.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 px-2">
              <input type="checkbox" checked={onlyBlocked} onChange={(e) => setOnlyBlocked(e.target.checked)} /> Blocked
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 px-2">
              <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} /> Overdue
            </label>
            {filtersActive && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900"><X className="w-3 h-3" /> Clear</button>
            )}
            <span className="ml-auto text-xs text-zinc-500">{filtered.length} / {rows.length} requests</span>
          </div>

          {/* Blocs visibles */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Column blocks</span>
            {BLOCK_ORDER.map((b) => (
              <button key={b} onClick={() => toggleBlock(b)}
                className={`text-[11px] font-bold rounded-full px-2.5 py-1 border ${hidden.has(b) ? "bg-white text-zinc-400 border-zinc-200 line-through" : "bg-[#D9E2F8] text-[#3C5E8F] border-[#D9E2F8]"}`}>
                {BLOCK_TITLE[b]}
              </button>
            ))}
          </div>

          <RegisterTable rows={filtered} hidden={hidden} onOpen={(r) => setSelectedId(r.id)} selectedId={selectedId} />
        </>
      )}

      {showNew && (
        <NewRequestDialog ctx={ctx} onClose={() => setShowNew(false)}
          onCreated={(id) => { setShowNew(false); setSelectedId(id); void load(); }} />
      )}
      {selected && <RequestPanel ctx={ctx} row={selected} onClose={() => setSelectedId(null)} onChanged={() => void load()} />}
    </div>
  );
}
