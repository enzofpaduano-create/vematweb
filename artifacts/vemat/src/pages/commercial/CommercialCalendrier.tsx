import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { CommercialLayout } from "./CommercialLayout";
import { useCommercialAuth } from "@/contexts/CommercialAuthContext";
import { supabaseCommercial } from "@/lib/supabase";
import type { CommercialEvent } from "@/lib/database.types";
import { useLang } from "@/i18n/I18nProvider";

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function getEventTypes(t: (k: string) => string) {
  return [
    { value: "visite",  label: t("portal.commercial_page.eventTypes.visite"),  color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
    { value: "reunion", label: t("portal.commercial_page.eventTypes.reunion"), color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { value: "appel",   label: t("portal.commercial_page.eventTypes.appel"),   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { value: "autre",   label: t("portal.commercial_page.eventTypes.autre"),   color: "bg-zinc-700 text-zinc-400 border-zinc-600" },
  ];
}

const emptyForm = () => ({ title: "", type: "visite" as CommercialEvent["type"], client_name: "", date: "", start_time: "", end_time: "", location: "", notes: "" });

export default function CommercialCalendrier() {
  const { commercial } = useCommercialAuth();
  const { lang, t } = useLang();
  const EVENT_TYPES = getEventTypes(t);
  const DAYS = lang === "fr" ? DAYS_FR : DAYS_EN;
  const MONTHS = lang === "fr" ? MONTHS_FR : MONTHS_EN;
  const MONTHS_SHORT = lang === "fr" ? MONTHS_SHORT_FR : MONTHS_SHORT_EN;
  const [events, setEvents] = useState<CommercialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CommercialEvent | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const load = async () => {
    if (!commercial) return;
    setLoading(true);
    const from = toDateStr(weekStart);
    const to = toDateStr(addDays(weekStart, 6));
    const { data } = await supabaseCommercial.from("commercial_events")
      .select("*").eq("commercial_id", commercial.id).gte("date", from).lte("date", to).order("start_time");
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [commercial, weekStart]);

  const openCreate = (date?: string) => {
    setEditEvent(null);
    setForm({ ...emptyForm(), date: date ?? "" });
    setShowForm(true);
  };

  const openEdit = (ev: CommercialEvent) => {
    setEditEvent(ev);
    setForm({ title: ev.title, type: ev.type, client_name: ev.client_name ?? "", date: ev.date, start_time: ev.start_time ?? "", end_time: ev.end_time ?? "", location: ev.location ?? "", notes: ev.notes ?? "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commercial) { setSaveError("Profil commercial non chargé — déconnectez-vous et reconnectez-vous."); return; }
    if (!form.title || !form.date) return;
    setSaving(true);
    setSaveError(null);
    const payload = { ...form, commercial_id: commercial.id, client_name: form.client_name || null, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location || null, notes: form.notes || null };
    const { error } = editEvent
      ? await supabaseCommercial.from("commercial_events").update(payload).eq("id", editEvent.id)
      : await supabaseCommercial.from("commercial_events").insert(payload);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setShowForm(false);
    setEditEvent(null);
    load();
  };

  const handleDelete = async (ev: CommercialEvent) => {
    if (!confirm(t("portal.commercial_page.confirmDeleteEvent"))) return;
    await supabaseCommercial.from("commercial_events").delete().eq("id", ev.id);
    setShowForm(false);
    setEditEvent(null);
    load();
  };

  const eventsForDay = (d: Date) => events.filter((e) => e.date === toDateStr(d));

  const weekLabel = () => {
    const a = days[0], b = days[6];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  };

  return (
    <CommercialLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">{t("portal.commercial_page.planningTitle")}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{t("portal.commercial_page.planningSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => openCreate()}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> {t("portal.commercial_page.newEvent")}
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="text-xs font-bold border border-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
              {t("portal.calendar.today")}
            </button>
            <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
              <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="p-2 hover:bg-zinc-800 text-zinc-400 transition-colors border-r border-zinc-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-zinc-300 px-4 min-w-48 text-center">{weekLabel()}</span>
              <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="p-2 hover:bg-zinc-800 text-zinc-400 transition-colors border-l border-zinc-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="space-y-2">
          {days.map((day, i) => {
            const dayEvs = eventsForDay(day);
            const isToday = toDateStr(day) === toDateStr(today);
            const isPast = day < today;
            return (
              <div key={i} className={`rounded-xl border overflow-hidden transition-all ${isToday ? "border-sky-500/40 bg-sky-500/5" : isPast ? "border-zinc-800 opacity-60" : "border-zinc-800"}`}>
                <div className={`px-5 py-3 flex items-center justify-between border-b ${isToday ? "border-sky-500/20 bg-sky-500/10" : "border-zinc-800 bg-zinc-900"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-center min-w-[36px] ${isToday ? "text-sky-400" : isPast ? "text-zinc-600" : "text-zinc-300"}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest">{DAYS[i]}</p>
                      <p className="text-xl font-black leading-none mt-0.5">{day.getDate()}</p>
                    </div>
                    {isToday && <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full">{t("portal.calendar.today")}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {dayEvs.length > 0 && <span className="text-xs font-bold text-zinc-500">{dayEvs.length} {dayEvs.length > 1 ? t("portal.commercial_page.eventCountPlural") : t("portal.commercial_page.eventCount")}</span>}
                    <button onClick={() => openCreate(toDateStr(day))}
                      className="text-zinc-600 hover:text-sky-400 transition-colors p-1 rounded">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div className="px-5 py-3 text-zinc-700 text-sm">—</div>
                ) : dayEvs.length === 0 ? (
                  <div className="px-5 py-4 text-center text-zinc-700 text-sm">{t("portal.commercial_page.noEvents")}</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {dayEvs.map((ev) => {
                      const et = EVENT_TYPES.find((et) => et.value === ev.type) ?? EVENT_TYPES[3];
                      return (
                        <div key={ev.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-zinc-800/30 transition-colors">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${et.color}`}>{et.label}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{ev.title}</p>
                              {ev.client_name && <p className="text-xs text-zinc-400 mt-0.5">{ev.client_name}</p>}
                              {(ev.start_time || ev.location) && (
                                <p className="text-xs text-zinc-600 mt-0.5">{[ev.start_time && `${ev.start_time}${ev.end_time ? ` – ${ev.end_time}` : ""}`, ev.location].filter(Boolean).join(" · ")}</p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => openEdit(ev)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 p-1">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="font-black text-white">{editEvent ? t("portal.commercial_page.editEvent") : t("portal.commercial_page.newEvent")}</h3>
              <button onClick={() => { setShowForm(false); setEditEvent(null); }} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formTitle")} *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                  placeholder="Visite chez X" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formType")}</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CommercialEvent["type"] }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500">
                    {EVENT_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formDate")} *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formStart")}</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formEnd")}</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.commercial_page.formClient")}</label>
                <input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                  placeholder="Nom du client" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Lieu</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Adresse ou ville" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">{t("portal.common.notes")}</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  placeholder="Objectif de la visite, préparation…" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 resize-none" />
              </div>
              {saveError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>}
              <div className="flex gap-3 pt-1">
                {editEvent && (
                  <button type="button" onClick={() => handleDelete(editEvent)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> {t("portal.common.delete")}
                  </button>
                )}
                <button type="button" onClick={() => { setShowForm(false); setEditEvent(null); }}
                  className="flex-1 border border-zinc-700 text-zinc-400 font-bold py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-sm">
                  {t("portal.common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
                  <Check className="w-4 h-4" /> {saving ? "..." : t("portal.common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialLayout>
  );
}
