import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, CheckCircle, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import vematLogo from "@/assets/vemat-logo.png";

const FAMILY_NAMES: Record<string, string> = {
  ACC: "Accessoires",
  ACP: "Outils pneumatiques",
  AIG: "Roulements & Aiguilles",
  BOL: "Flèches & Boulonnerie",
  BRR: "Brise-roches",
  CAR: "Carrosserie",
  CHA: "Châssis",
  ECL: "Éclairage",
  ELE: "Électronique",
  ENG: "Moteur",
  FIL: "Filtres",
  FLE: "Flexibles & Joints",
  FOUR: "Fournitures",
  FRE: "Freinage",
  HUI: "Huiles & Graisses",
  HYD: "Hydraulique",
  MARK: "Marketing",
  MOT: "Motorisation",
  NAC: "Nacelles",
  OUT: "Outillage général",
  OUTELEC: "Outillage électrique",
  OUTHYD: "Outillage hydraulique",
  OUTLEV: "Outillage de levage",
  OUTMEC: "Outillage mécanique",
  PARK: "Parking",
  RG: "Garanties",
  SAV: "SAV",
  SNIM: "SNIM",
  TRN: "Transmission",
  VEHI: "Véhicules",
  VER: "Vérins",
};

const FAMILY_ICONS: Record<string, string> = {
  ACC: "🔩", ACP: "🔨", AIG: "⚙️", BOL: "🪛", BRR: "⛏️",
  CAR: "🚘", CHA: "🔗", ECL: "💡", ELE: "🔌", ENG: "🏎️",
  FIL: "🧹", FLE: "🌀", FOUR: "📦", FRE: "🛑", HUI: "🛢️",
  HYD: "💧", MARK: "📣", MOT: "⚡", NAC: "🏗️", OUT: "🔧",
  OUTELEC: "🔋", OUTHYD: "💦", OUTLEV: "🏋️", OUTMEC: "🔩",
  PARK: "🅿️", RG: "📋", SAV: "🛠️", SNIM: "📁", TRN: "⚙️",
  VEHI: "🚗", VER: "🔩",
};

interface VematProduct {
  sku: string;
  title: string;
  image: string | null;
  quantity: number;
  unite: string;
  model: string | null;
}

interface VematFamily {
  code: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
  models: string[];
  products: VematProduct[];
}

interface VematCatalog {
  supplier: string;
  generatedAt: string;
  totalProducts: number;
  totalFamilies: number;
  families: VematFamily[];
}

function buildImageMap(catalog: VematCatalog | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!catalog) return map;
  for (const family of catalog.families) {
    for (const p of family.products) {
      if (p.image) map[p.sku] = p.image;
    }
  }
  return map;
}

function parseExcel(buffer: ArrayBuffer, imageMap: Record<string, string>): VematCatalog {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });

  const familiesMap: Record<string, {
    meta: { code: string; name: string; slug: string; icon: string };
    products: VematProduct[];
    models: Set<string>;
  }> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as string[];
    const code = String(row[0] ?? "").trim();
    const libelle = String(row[1] ?? "").trim();
    const qtyStr = String(row[2] ?? "").trim();
    const familleRaw = String(row[3] ?? "").trim().toUpperCase();
    const sousFam = String(row[4] ?? "").trim();
    const unite = String(row[5] ?? "").trim();

    if (!code) continue;

    // Handle qty — can be "3.00", "3", or a formatted number
    const qty = parseFloat(qtyStr.replace(",", ".")) || 0;
    if (qty <= 0) continue;

    const famille = familleRaw || "INCONNU";

    if (!familiesMap[famille]) {
      familiesMap[famille] = {
        meta: {
          code: famille,
          name: FAMILY_NAMES[famille] ?? famille,
          slug: `vemat-${famille.toLowerCase()}`,
          icon: FAMILY_ICONS[famille] ?? "📦",
        },
        products: [],
        models: new Set(),
      };
    }

    familiesMap[famille].products.push({
      sku: code,
      title: libelle,
      image: imageMap[code] ?? null,
      quantity: qty,
      unite,
      model: sousFam || null,
    });

    if (sousFam) familiesMap[famille].models.add(sousFam);
  }

  const families: VematFamily[] = Object.values(familiesMap)
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name, "fr"))
    .map((f) => ({
      ...f.meta,
      productCount: f.products.length,
      models: [...f.models].sort(),
      products: f.products,
    }));

  const totalProducts = families.reduce((s, f) => s + f.productCount, 0);

  return {
    supplier: "Vemat Stock",
    generatedAt: new Date().toISOString().slice(0, 10),
    totalProducts,
    totalFamilies: families.length,
    families,
  };
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(
    () => typeof sessionStorage !== "undefined" && sessionStorage.getItem("vemat_admin") === "1"
  );

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [newCatalog, setNewCatalog] = useState<VematCatalog | null>(null);
  const [currentCatalog, setCurrentCatalog] = useState<VematCatalog | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: true; date: string } | { error: string } | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/vemat-stock-catalog.json")
      .then((r) => r.json())
      .then(setCurrentCatalog)
      .catch(() => {});
  }, []);

  const handleLogin = () => {
    if (!password.trim()) return;
    sessionStorage.setItem("vemat_admin", "1");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("vemat_admin");
    setAuthenticated(false);
    setPassword("");
    setNewCatalog(null);
    setFile(null);
    setPublishResult(null);
  };

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setParsing(true);
      setParseError(null);
      setNewCatalog(null);
      setPublishResult(null);

      try {
        const buffer = await f.arrayBuffer();
        const imageMap = buildImageMap(currentCatalog);
        const catalog = parseExcel(buffer, imageMap);
        setNewCatalog(catalog);
      } catch (e) {
        setParseError(`Erreur de lecture : ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setParsing(false);
      }
    },
    [currentCatalog]
  );

  const handlePublish = async () => {
    if (!newCatalog) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, catalog: newCatalog }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPublishResult({ ok: true, date: data.date });
        setCurrentCatalog(newCatalog);
      } else {
        setPublishResult({ error: data.error || `Erreur ${res.status}` });
      }
    } catch (e) {
      setPublishResult({ error: String(e) });
    } finally {
      setPublishing(false);
    }
  };

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-zinc-50">
        <div className="bg-white border border-zinc-200 shadow-sm p-8 w-full max-w-sm">
          <img src={vematLogo} alt="Vemat" className="h-8 mb-6" />
          <h1 className="text-xl font-bold mb-1">Administration</h1>
          <p className="text-sm text-zinc-500 mb-6">Mise à jour du catalogue PDR</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full border border-zinc-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:border-accent"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="w-full bg-accent text-white py-2.5 text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Accéder
          </button>
        </div>
      </div>
    );
  }

  // ── Admin UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={vematLogo} alt="Vemat" className="h-7" />
            <div>
              <h1 className="text-xl font-bold leading-none">Stock PDR</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Mise à jour du catalogue</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>

        {/* Current catalog status */}
        {currentCatalog && (
          <div className="bg-white border border-zinc-200 px-5 py-4 mb-6 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Catalogue en ligne</span>
            <span className="font-semibold">
              {currentCatalog.totalProducts.toLocaleString("fr")} pièces ·{" "}
              {currentCatalog.totalFamilies} familles
              <span className="text-zinc-400 font-normal ml-2">· {currentCatalog.generatedAt}</span>
            </span>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mb-6 text-sm text-amber-800">
          <strong>Comment ça marche :</strong> dépose l'export Excel du logiciel Atlas (même format que d'habitude).
          Le site se mettra à jour automatiquement en quelques minutes après la publication.
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all mb-6 ${
            dragOver
              ? "border-accent bg-accent/5"
              : file
              ? "border-accent/60 bg-accent/5"
              : "border-zinc-300 hover:border-zinc-400 bg-white"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
          }}
        >
          <Upload className={`h-8 w-8 mx-auto mb-3 ${file ? "text-accent" : "text-zinc-300"}`} />
          {file ? (
            <>
              <p className="text-sm font-semibold text-accent">{file.name}</p>
              <p className="text-xs text-zinc-400 mt-1">{(file.size / 1024).toFixed(0)} Ko — cliquer pour changer</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 mb-1">Déposer l'export Excel ici</p>
              <p className="text-xs text-zinc-400">ou cliquer pour sélectionner · .xls ou .xlsx</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = "";
          }}
        />

        {/* Parsing state */}
        {parsing && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Lecture du fichier…
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 text-sm mb-6 rounded">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed catalog preview */}
        {newCatalog && (
          <div className="bg-white border border-zinc-200 mb-6">
            <div className="px-6 py-5 border-b border-zinc-100">
              <h2 className="text-base font-bold">Aperçu du nouveau catalogue</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-zinc-100 border-b border-zinc-100">
              <div className="px-6 py-5">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Pièces en stock</p>
                <p className="text-3xl font-black">{newCatalog.totalProducts.toLocaleString("fr")}</p>
                {currentCatalog && (() => {
                  const diff = newCatalog.totalProducts - currentCatalog.totalProducts;
                  return (
                    <p className={`text-xs mt-1 font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {diff >= 0 ? "+" : ""}{diff.toLocaleString("fr")} vs catalogue actuel
                    </p>
                  );
                })()}
              </div>
              <div className="px-6 py-5">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Familles</p>
                <p className="text-3xl font-black">{newCatalog.totalFamilies}</p>
                {currentCatalog && (() => {
                  const diff = newCatalog.totalFamilies - currentCatalog.totalFamilies;
                  if (diff === 0) return null;
                  return (
                    <p className={`text-xs mt-1 font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {diff >= 0 ? "+" : ""}{diff} vs actuel
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Family breakdown */}
            <div className="px-6 py-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Détail par famille</p>
              <div className="divide-y divide-zinc-50">
                {newCatalog.families.map((f) => {
                  const currentFamily = currentCatalog?.families.find((cf) => cf.code === f.code);
                  const diff = currentFamily ? f.productCount - currentFamily.productCount : null;
                  return (
                    <div key={f.code} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none">{f.icon}</span>
                        <span className="font-medium">{f.name}</span>
                        <span className="text-xs text-zinc-400 font-mono">{f.code}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-600">{f.productCount} pièces</span>
                        {diff !== null && diff !== 0 && (
                          <span className={`text-xs font-medium ${diff > 0 ? "text-green-600" : "text-red-500"}`}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Publish section */}
            <div className="px-6 py-5 border-t border-zinc-100">
              {publishResult && "ok" in publishResult ? (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded text-sm">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Catalogue publié avec succès</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Le site se mettra à jour automatiquement dans quelques minutes.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {publishResult && "error" in publishResult && (
                    <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 text-sm rounded mb-4">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{publishResult.error}</span>
                    </div>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full bg-accent text-white py-3 text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Publication en cours…
                      </>
                    ) : (
                      "Publier le catalogue"
                    )}
                  </button>
                  <p className="text-xs text-zinc-400 text-center mt-2">
                    Le mot de passe entré à la connexion sera vérifié côté serveur.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
