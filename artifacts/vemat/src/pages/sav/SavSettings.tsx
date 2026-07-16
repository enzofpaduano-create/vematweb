import { useEffect, useState } from "react";
import { Save, Check } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { getSavSettings, saveSavSettings, DEFAULT_SETTINGS, type SavSettings as Settings, type Currency } from "@/lib/savDocuments";

export default function SavSettings() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSavSettings().then((r) => { setS(r); setLoading(false); });
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      await saveSavSettings(s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";
  const numField = (val: number, on: (n: number) => void) => (
    <input className={ic} type="number" step="0.01" value={val} onChange={(e) => on(Number(e.target.value))} />
  );

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-600 mb-2">Service</p>
          <h1 className="text-3xl lg:text-4xl font-black text-zinc-950 mb-2">Settings</h1>
          <p className="text-zinc-500 text-sm mb-8">Default rates applied automatically to new offers (still editable per offer).</p>

          {loading ? (
            <p className="text-zinc-400 text-sm py-10 text-center animate-pulse">Loading…</p>
          ) : (
            <>
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Labour</h2>
                <div><label className={lbl}>Daily rate</label>{numField(s.labour_daily_rate, (n) => set("labour_daily_rate", n))}</div>
              </section>

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Travel</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Rate per km</label>{numField(s.travel_km_rate, (n) => set("travel_km_rate", n))}</div>
                  <div><label className={lbl}>Rate per travel hour</label>{numField(s.travel_hour_rate, (n) => set("travel_hour_rate", n))}</div>
                  <div><label className={lbl}>Meals (per day)</label>{numField(s.meal_rate, (n) => set("meal_rate", n))}</div>
                  <div><label className={lbl}>Hotel (per night)</label>{numField(s.hotel_rate, (n) => set("hotel_rate", n))}</div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
                <h2 className="font-black text-zinc-950 mb-4">Defaults</h2>
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <label className={lbl}>Currency</label>
                    <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
                      {(["EUR", "USD"] as Currency[]).map((c) => (
                        <button key={c} type="button" onClick={() => set("default_currency", c)}
                          className={`px-4 py-2 text-sm font-bold transition-colors ${s.default_currency === c ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                          {c === "EUR" ? "€ EUR" : "$ USD"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className={lbl}>VAT rate %</label><input className={`${ic} w-24`} type="number" step="0.5" value={s.default_vat_rate} onChange={(e) => set("default_vat_rate", Number(e.target.value))} /></div>
                </div>
              </section>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">{error}</p>}

              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60">
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
              </button>
            </>
          )}
        </div>
      </SavLayout>
    </SavGuard>
  );
}
