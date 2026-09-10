import { useEffect, useState } from "react";
import { Save, AlertCircle, ShieldCheck } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import { getApprovalSettings, saveApprovalSettings, type ApprovalSettings } from "@/lib/approval";

export default function PdrSettings() {
  const [settings, setSettings] = useState<ApprovalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getApprovalSettings(supabasePdr, "pdr")
      .then((s) => { if (!cancelled) { setSettings(s); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError((e as Error).message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await saveApprovalSettings(supabasePdr, "pdr", {
        amount_threshold: settings.amount_threshold,
        discount_threshold: settings.discount_threshold,
        manager_email: settings.manager_email,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Spare parts</p>
            <h1 className="text-3xl font-black text-zinc-950">Settings</h1>
            <p className="text-sm text-zinc-500 mt-1">Manager approval rules for the PDR portal.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading && <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading…</p>}

          {settings && (
            <section className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h2 className="font-black text-zinc-950">Quote approval workflow</h2>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                A quote that meets ANY of these criteria will be blocked from being sent to the client until a Manager approves it.
                The manager receives an email at the address below with a link to the document.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={lbl}>Amount threshold</label>
                  <input
                    type="number" min="0" step="100"
                    className={ic}
                    value={settings.amount_threshold}
                    onChange={(e) => setSettings({ ...settings, amount_threshold: Number(e.target.value) })}
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Any quote with total ≥ this amount needs approval (in the doc's currency).</p>
                </div>
                <div>
                  <label className={lbl}>Discount threshold (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.5"
                    className={ic}
                    value={settings.discount_threshold}
                    onChange={(e) => setSettings({ ...settings, discount_threshold: Number(e.target.value) })}
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Any line with discount ≥ this % triggers approval.</p>
                </div>
              </div>

              <div className="mb-6">
                <label className={lbl}>Manager email (recipient of validation requests)</label>
                <input
                  type="email"
                  className={ic}
                  placeholder="manager.pdr@vematgroup.com"
                  value={settings.manager_email ?? ""}
                  onChange={(e) => setSettings({ ...settings, manager_email: e.target.value || null })}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  If empty, requests fall back to vemat@vematgroup.com. Emails also copy the master inbox.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {saved && <span className="text-xs text-emerald-600 font-semibold">Saved ✓</span>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save settings"}
                </button>
              </div>
            </section>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
