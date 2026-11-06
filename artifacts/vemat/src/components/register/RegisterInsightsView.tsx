import { useMemo } from "react";
import {
  computeRegisterInsights, STAGE_LABEL, type RegisterRow,
} from "@/lib/quotationRegister";

function Bar({ value, max, className = "bg-sky-500" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${value > 0 ? pct : 0}%` }} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-xl p-4">
      <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export function RegisterInsightsView({ rows }: { rows: RegisterRow[] }) {
  const ins = useMemo(() => computeRegisterInsights(rows), [rows]);
  const f = ins.funnel;
  const funnelRows: [string, number, string][] = [
    ["Requests received", f.received, "bg-zinc-400"],
    ["Quotes prepared", f.quoted, "bg-sky-500"],
    ["Quotes sent", f.sent, "bg-indigo-500"],
    ["Won", f.won, "bg-emerald-500"],
    ["Lost", f.lost, "bg-red-400"],
  ];
  const stageMax = Math.max(1, ...ins.byStage.map((s) => s.count));
  const monthMax = Math.max(1, ...ins.byMonth.map((m) => m.count));
  const decided = f.won + f.lost;

  return (
    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Funnel">
        <ul className="space-y-2.5">
          {funnelRows.map(([label, n, cls]) => (
            <li key={label}>
              <div className="flex justify-between text-sm mb-1"><span className="text-zinc-700">{label}</span><span className="font-black tabular-nums">{n}</span></div>
              <Bar value={n} max={f.received} className={cls} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          {f.sent > 0 ? `${Math.round((f.won / f.sent) * 100)}% of sent quotes won` : "No quote sent yet"}
          {decided > 0 ? ` · ${Math.round((f.won / decided) * 100)}% of decided quotes won` : ""}
          {ins.chaseCount > 0 ? ` · ${ins.chaseCount} to follow up` : ""}
        </p>
      </Card>

      <Card title="Requests by stage">
        <ul className="space-y-2.5">
          {ins.byStage.map((s) => (
            <li key={s.stage}>
              <div className="flex justify-between text-sm mb-1"><span className="text-zinc-700">{STAGE_LABEL[s.stage]}</span><span className="font-black tabular-nums">{s.count}</span></div>
              <Bar value={s.count} max={stageMax} />
            </li>
          ))}
          {ins.byStage.length === 0 && <li className="text-sm text-zinc-400">No data yet.</li>}
        </ul>
      </Card>

      <Card title="Top clients">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-zinc-400 uppercase tracking-wider text-left">
                <th className="py-1 pr-3 font-bold">Client</th>
                <th className="py-1 px-2 font-bold text-right">Req.</th>
                <th className="py-1 px-2 font-bold text-right">Sent</th>
                <th className="py-1 px-2 font-bold text-right">Won</th>
                <th className="py-1 px-2 font-bold text-right">Lost</th>
                <th className="py-1 pl-3 font-bold text-right">Open amount</th>
              </tr>
            </thead>
            <tbody>
              {ins.byClient.map((c) => (
                <tr key={c.client} className="border-t border-zinc-100">
                  <td className="py-1.5 pr-3 font-semibold text-zinc-800">{c.client}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{c.requests}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{c.sent}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-emerald-600 font-bold">{c.won}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-red-500">{c.lost}</td>
                  <td className="py-1.5 pl-3 text-right tabular-nums text-xs text-zinc-600">
                    {Object.entries(c.pending).map(([cur, v]) => `${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })} ${cur}`).join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card title="Requests per month (last 6 months)">
          <div className="flex items-end gap-2 h-28">
            {ins.byMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <span className="text-[11px] font-black tabular-nums text-zinc-700">{m.count}</span>
                <div className="w-full rounded-t bg-sky-500" style={{ height: `${Math.round((m.count / monthMax) * 70)}%`, minHeight: m.count > 0 ? 4 : 0 }} />
                <span className="text-[10px] text-zinc-400">{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="By costing owner">
          <ul className="space-y-1.5">
            {ins.byOwner.map((o) => (
              <li key={o.owner} className="flex justify-between text-sm">
                <span className="text-zinc-700">{o.owner}</span>
                <span className="tabular-nums text-zinc-600">
                  <b className="text-zinc-900">{o.requests}</b> req.{o.avgDaysToSend != null ? ` · avg ${o.avgDaysToSend} d to send` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
