import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ImagePlus, FileText, X, Upload } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { Chantier } from "@/lib/database.types";

const EQUIPMENT_TYPES = ["Grue mobile", "Grue à tour", "Nacelle", "Chariot télescopique", "Engin de construction", "Autre"];

const FIELD = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`} />
);

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-square flex items-center justify-center">
      {isImage && src ? (
        <img src={src} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <FileText className="w-6 h-6 text-zinc-400" />
          <p className="text-[9px] text-zinc-500 font-medium truncate w-full px-1">{file.name}</p>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function EspaceClientNouvelleReparation() {
  const [, navigate] = useLocation();
  const { company, user } = useClientAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    chantierId: "", equipmentType: "", equipmentBrand: "", equipmentModel: "",
    equipmentSerial: "", description: "", priority: "normale" as "normale" | "urgente",
  });

  useEffect(() => {
    if (!company) return;
    supabase.from("chantiers").select("*").eq("company_id", company.id).eq("active", true)
      .then(({ data }) => setChantiers(data ?? []));
  }, [company]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    setFiles((prev) => [...prev, ...valid].slice(0, 10));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    if (!form.equipmentType || !form.description) { setError("Remplissez les champs obligatoires"); return; }
    setLoading(true);
    setError(null);

    const { data: newRepair, error: insertErr } = await supabase.from("repair_requests").insert({
      company_id: company.id,
      created_by: user.id,
      chantier_id: form.chantierId || null,
      equipment_type: form.equipmentType,
      equipment_brand: form.equipmentBrand || null,
      equipment_model: form.equipmentModel || null,
      equipment_serial: form.equipmentSerial || null,
      description: form.description,
      priority: form.priority,
      status: "en_attente",
    }).select("id").single();

    if (insertErr || !newRepair) { setError(insertErr?.message ?? "Erreur"); setLoading(false); return; }

    if (files.length > 0) {
      const attachments: { name: string; url: string; type: string }[] = [];
      for (const file of files) {
        const path = `${newRepair.id}/client/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("repair-attachments").upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("repair-attachments").getPublicUrl(path);
          attachments.push({ name: file.name, url: urlData.publicUrl, type: file.type });
        }
      }
      if (attachments.length > 0) {
        await supabase.from("repair_requests").update({ attachments }).eq("id", newRepair.id);
      }
    }

    setLoading(false);
    navigate("/espace-client/reparations");
  };

  return (
    <PortalLayout>
      <div className="p-8 max-w-3xl">
        <button onClick={() => navigate("/espace-client/reparations")} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl font-black text-zinc-900 mb-1">Demande de réparation</h1>
        <p className="text-sm text-zinc-500 mb-8">Notre équipe planifiera une intervention et vous confirmera la date.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Priority */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Niveau de priorité</label>
            <div className="flex gap-3">
              {(["normale", "urgente"] as const).map((p) => (
                <label key={p} className={`flex-1 flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${form.priority === p ? p === "urgente" ? "border-red-400 bg-red-50" : "border-accent bg-accent/5" : "border-zinc-200 hover:border-zinc-300"}`}>
                  <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={set("priority")} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.priority === p ? p === "urgente" ? "border-red-400" : "border-accent" : "border-zinc-300"}`}>
                    {form.priority === p && <div className={`w-2 h-2 rounded-full ${p === "urgente" ? "bg-red-400" : "bg-accent"}`} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm capitalize">{p}</p>
                    <p className="text-xs text-zinc-500">{p === "urgente" ? "Arrêt de chantier" : "Maintenance planifiable"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Équipement */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500">Équipement concerné</h2>
            <FIELD label="Type d'équipement" required>
              <select value={form.equipmentType} onChange={set("equipmentType")} required className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                <option value="">— Sélectionner —</option>
                {EQUIPMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </FIELD>
            <div className="grid grid-cols-2 gap-4">
              <FIELD label="Marque"><Input value={form.equipmentBrand} onChange={set("equipmentBrand")} placeholder="JLG, Tadano, Terex..." /></FIELD>
              <FIELD label="Modèle"><Input value={form.equipmentModel} onChange={set("equipmentModel")} placeholder="450AJ, ATF 60G-4..." /></FIELD>
            </div>
            <FIELD label="Numéro de série"><Input value={form.equipmentSerial} onChange={set("equipmentSerial")} placeholder="SN-XXXX-XXXX" className="font-mono" /></FIELD>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <FIELD label="Description du problème" required>
              <textarea value={form.description} onChange={set("description")} required rows={5}
                placeholder="Décrivez le problème observé, les symptômes, depuis quand, dans quelles conditions..."
                className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
            </FIELD>
          </div>

          {/* Photos & documents */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">Photos & documents</h2>
            <p className="text-xs text-zinc-400 mb-4">Ajoutez des photos du problème ou des documents utiles (PDF). Max 10 fichiers.</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}`}
            >
              <ImagePlus className="w-7 h-7 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-600">Glisser-déposer ou cliquer pour sélectionner</p>
              <p className="text-xs text-zinc-400">Images (JPG, PNG) et PDF · Max 10 Mo par fichier</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {files.map((file, i) => (
                  <FilePreview key={i} file={file} onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
                ))}
              </div>
            )}
          </div>

          {/* Chantier */}
          {chantiers.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <FIELD label="Chantier / Localisation">
                <select value={form.chantierId} onChange={set("chantierId")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                  <option value="">— Aucun chantier sélectionné —</option>
                  {chantiers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
                </select>
              </FIELD>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/espace-client/reparations")}
              className="flex-1 border border-zinc-200 text-zinc-600 font-bold py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-zinc-900 text-white font-bold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Upload className="w-4 h-4 animate-bounce" />
                  {files.length > 0 ? "Envoi et upload..." : "Envoi..."}
                </>
              ) : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
