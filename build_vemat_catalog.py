#!/usr/bin/env python3
"""
Build Vemat stock catalog JSON and copy matching product photos.
"""
import os
import shutil
import json
import xlrd

# ── Paths ────────────────────────────────────────────────────────────────────
BASE = "/Users/enzopaduano/Desktop/vematweb"
XLS_PATH = os.path.join(BASE, "PHOTO-pdr", "articles Atlas 27032026.xls")
PHOTO_SRC = os.path.join(BASE, "PHOTO-pdr")
OUT_JSON = os.path.join(BASE, "artifacts", "vemat", "public", "vemat-stock-catalog.json")
OUT_IMG_DIR = os.path.join(BASE, "artifacts", "vemat", "public", "images", "vemat-pdr")

# ── Family mappings ───────────────────────────────────────────────────────────
FAMILY_NAMES = {
    "ACC": "Accessoires",
    "ACP": "Outils pneumatiques",
    "AIG": "Roulements & Aiguilles",
    "BOL": "Flèches & Boulonnerie",
    "BRR": "Brise-roches",
    "CAR": "Carrosserie",
    "CHA": "Châssis",
    "ECL": "Éclairage",
    "ELE": "Électronique",
    "ENG": "Moteur",
    "FIL": "Filtres",
    "FLE": "Flexibles & Joints",
    "FOUR": "Fournitures",
    "FRE": "Freinage",
    "HUI": "Huiles & Graisses",
    "HYD": "Hydraulique",
    "MARK": "Marketing",
    "MOT": "Motorisation",
    "NAC": "Nacelles",
    "OUT": "Outillage général",
    "OUTELEC": "Outillage électrique",
    "OUTHYD": "Outillage hydraulique",
    "OUTLEV": "Outillage de levage",
    "OUTMEC": "Outillage mécanique",
    "PARK": "Parking",
    "RG": "Garanties",
    "SAV": "SAV",
    "SNIM": "SNIM",
    "TRN": "Transmission",
    "VEHI": "Véhicules",
    "VER": "Vérins",
}

FAMILY_ICONS = {
    "ACC": "🔩", "ACP": "🔨", "AIG": "⚙️", "BOL": "🪛", "BRR": "⛏️",
    "CAR": "🚘", "CHA": "🔗", "ECL": "💡", "ELE": "🔌", "ENG": "🏎️",
    "FIL": "🧹", "FLE": "🌀", "FOUR": "📦", "FRE": "🛑", "HUI": "🛢️",
    "HYD": "💧", "MARK": "📣", "MOT": "⚡", "NAC": "🏗️", "OUT": "🔧",
    "OUTELEC": "🔋", "OUTHYD": "💦", "OUTLEV": "🏋️", "OUTMEC": "🔩",
    "PARK": "🅿️", "RG": "📋", "SAV": "🛠️", "SNIM": "📁", "TRN": "⚙️",
    "VEHI": "🚗", "VER": "🔩",
}

# ── 1. Build photo lookup (code → filepath) ───────────────────────────────────
print("Building photo index...")
photo_map = {}  # lowercase_code_no_ext → (full_path, original_ext)
for fname in os.listdir(PHOTO_SRC):
    lower = fname.lower()
    if lower.endswith(".jpg") or lower.endswith(".jpeg") or lower.endswith(".png"):
        ext = os.path.splitext(lower)[1]          # e.g. ".jpg"
        code_key = os.path.splitext(lower)[0]     # e.g. "00003212"
        photo_map[code_key] = (os.path.join(PHOTO_SRC, fname), ext)

print(f"  {len(photo_map)} photos indexed")

# ── 2. Read Excel, filter in-stock ───────────────────────────────────────────
print("Reading Excel...")
wb = xlrd.open_workbook(XLS_PATH)
sh = wb.sheet_by_index(0)

in_stock_rows = []
for r in range(1, sh.nrows):
    qty = sh.cell_value(r, 2)
    try:
        qty_float = float(qty)
    except (TypeError, ValueError):
        qty_float = 0.0
    if qty_float > 0:
        code     = str(sh.cell_value(r, 0)).strip()
        libelle  = str(sh.cell_value(r, 1)).strip()
        famille  = str(sh.cell_value(r, 3)).strip().upper()
        sous_fam = str(sh.cell_value(r, 4)).strip()
        unite    = str(sh.cell_value(r, 5)).strip()
        in_stock_rows.append({
            "code": code,
            "libelle": libelle,
            "qty": qty_float,
            "famille": famille,
            "sous_famille": sous_fam,
            "unite": unite,
        })

print(f"  {len(in_stock_rows)} in-stock parts")

# ── 3. Create output image directory ─────────────────────────────────────────
os.makedirs(OUT_IMG_DIR, exist_ok=True)
print(f"Output image dir: {OUT_IMG_DIR}")

# ── 4. Match photos and build per-family data ─────────────────────────────────
print("Matching photos and building catalog...")

families = {}   # code → {name, icon, products: [...]}
photos_copied = 0
photos_matched = 0

for row in in_stock_rows:
    code = row["code"]
    famille = row["famille"] if row["famille"] else "INCONNU"

    # Photo match: try exact lowercase, then zero-padded to 8 chars
    def find_photo(c):
        key = c.lower()
        if key in photo_map:
            return key
        padded = c.zfill(8).lower()
        if padded in photo_map:
            return padded
        return None

    matched_key = find_photo(code)
    if matched_key:
        src_path, ext = photo_map[matched_key]
        dest_fname = matched_key + ext          # already lowercase
        dest_path  = os.path.join(OUT_IMG_DIR, dest_fname)
        if not os.path.exists(dest_path):
            shutil.copy2(src_path, dest_path)
            photos_copied += 1
        image_url = f"/images/vemat-pdr/{dest_fname}"
        photos_matched += 1
    else:
        image_url = None

    product = {
        "sku":      code,
        "title":    row["libelle"],
        "image":    image_url,
        "quantity": row["qty"],
        "unite":    row["unite"],
        "model":    row["sous_famille"] if row["sous_famille"] else None,
    }

    if famille not in families:
        families[famille] = {
            "code":         famille,
            "name":         FAMILY_NAMES.get(famille, famille),
            "slug":         f"vemat-{famille.lower()}",
            "icon":         FAMILY_ICONS.get(famille, "📦"),
            "products":     [],
            "models_set":   set(),
        }
    families[famille]["products"].append(product)
    if row["sous_famille"]:
        families[famille]["models_set"].add(row["sous_famille"])

# ── 5. Serialise families (sorted by name) ────────────────────────────────────
families_list = []
for fam_data in sorted(families.values(), key=lambda x: x["name"]):
    models = sorted(fam_data["models_set"])
    families_list.append({
        "code":         fam_data["code"],
        "name":         fam_data["name"],
        "slug":         fam_data["slug"],
        "icon":         fam_data["icon"],
        "productCount": len(fam_data["products"]),
        "models":       models,
        "products":     fam_data["products"],
    })

# ── 6. Write JSON ─────────────────────────────────────────────────────────────
catalog = {
    "supplier":       "Vemat Stock",
    "generatedAt":    "2026-04-26",
    "totalProducts":  len(in_stock_rows),
    "totalFamilies":  len(families_list),
    "families":       families_list,
}

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\nJSON written to: {OUT_JSON}")

# ── 7. Summary ────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  Total in-stock parts : {len(in_stock_rows)}")
print(f"  Parts with photo     : {photos_matched}")
print(f"  Parts without photo  : {len(in_stock_rows) - photos_matched}")
print(f"  Photos copied        : {photos_copied}")
print(f"  Families             : {len(families_list)}")
print(f"{'='*60}")
print(f"\n  {'Family':<12} {'Name':<30} {'Count':>6}")
print(f"  {'-'*50}")
for fam in families_list:
    print(f"  {fam['code']:<12} {fam['name']:<30} {fam['productCount']:>6}")
print(f"{'='*60}")
