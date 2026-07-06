#!/usr/bin/env node
/**
 * Reset the technicien roster on Supabase:
 *  1. Fetch existing rows in `technicians`
 *  2. NULL out repair_requests.technician_id for each (preserves mission history)
 *  3. Delete rows from `technicians`
 *  4. Delete corresponding auth.users
 *  5. Create 3 new auth users (email_confirm=true so they can log in immediately)
 *  6. Insert 3 new rows in `technicians` with user_id linked
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (or in a .env.local file placed next to this script).
 * The service_role key is admin-level — never commit it.
 *
 * Usage:
 *   cd artifacts/api-server
 *   node scripts/manage-technicians.mjs           # dry-run (shows what will happen)
 *   node scripts/manage-technicians.mjs --apply   # actually run
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config: what we want the roster to look like at the end ------------
const COLOR = "#D51A2A"; // Vemat brand red (from --accent 355 78% 47%)
const NEW_TECHS = [
  { email: "tech01@vematgroup.com", password: "tech01@2026", name: "tech 01" },
  { email: "tech02@vematgroup.com", password: "tech02@2026", name: "tech 02" },
  { email: "tech03@vematgroup.com", password: "tech03@2026", name: "tech 03" },
];

// --- Minimal .env parser (no dep) ---------------------------------------
function loadDotenv(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotenv(join(__dirname, ".env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("\n❌ Missing env vars.");
  console.error("Create artifacts/api-server/scripts/.env.local with:");
  console.error("  SUPABASE_URL=https://yewuqkaqeyfehnflharh.supabase.co");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   (from Supabase → Project Settings → API → service_role)\n");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Helpers ------------------------------------------------------------
async function findAuthUserByEmail(email) {
  // Supabase admin API paginates — 1000 per page is plenty for our scale.
  let page = 1;
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

function label(u) {
  return `${u.name || "(no name)"} <${u.email || "(no email)"}>`;
}

// --- Main ---------------------------------------------------------------
async function main() {
  console.log(`\n🔧 Vemat technicien roster reset`);
  console.log(`   Mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes — pass --apply to run)"}`);
  console.log(`   Target: ${SUPABASE_URL}\n`);

  // 1. Fetch existing technicians
  const { data: existing, error: fetchErr } = await admin
    .from("technicians")
    .select("id, name, email, user_id, color");
  if (fetchErr) throw new Error(`fetch technicians failed: ${fetchErr.message}`);
  console.log(`📋 ${existing.length} existing technicien row(s):`);
  for (const t of existing) console.log(`   - ${label(t)}  id=${t.id}  user_id=${t.user_id || "(none)"}`);

  // 2. Detach repair_requests
  const oldIds = existing.map((t) => t.id);
  if (oldIds.length > 0) {
    const { data: linkedRepairs, error: repErr } = await admin
      .from("repair_requests")
      .select("id, reference, technician_id")
      .in("technician_id", oldIds);
    if (repErr) throw new Error(`fetch linked repairs failed: ${repErr.message}`);
    console.log(`\n🔗 ${linkedRepairs.length} repair_request(s) linked to those technicien(s):`);
    for (const r of linkedRepairs) console.log(`   - ${r.reference} (id=${r.id})`);

    if (APPLY && linkedRepairs.length > 0) {
      const { error: unlinkErr } = await admin
        .from("repair_requests")
        .update({ technician_id: null })
        .in("technician_id", oldIds);
      if (unlinkErr) throw new Error(`unlink repairs failed: ${unlinkErr.message}`);
      console.log(`   ✅ set technician_id = NULL on ${linkedRepairs.length} repair(s)`);
    } else if (linkedRepairs.length > 0) {
      console.log(`   (dry run) would set technician_id = NULL on ${linkedRepairs.length} repair(s)`);
    }
  }

  // 3. Delete rows in `technicians`
  if (APPLY && oldIds.length > 0) {
    const { error: delErr } = await admin.from("technicians").delete().in("id", oldIds);
    if (delErr) throw new Error(`delete technicians failed: ${delErr.message}`);
    console.log(`\n🗑  Deleted ${oldIds.length} row(s) from technicians`);
  } else if (oldIds.length > 0) {
    console.log(`\n🗑  (dry run) would delete ${oldIds.length} row(s) from technicians`);
  }

  // 4. Delete auth.users associated with the old techs
  const oldUserIds = existing.map((t) => t.user_id).filter(Boolean);
  if (APPLY) {
    for (const uid of oldUserIds) {
      const { error: authDelErr } = await admin.auth.admin.deleteUser(uid);
      if (authDelErr) {
        console.warn(`   ⚠️  could not delete auth user ${uid}: ${authDelErr.message}`);
      } else {
        console.log(`   ✅ deleted auth user ${uid}`);
      }
    }
  } else if (oldUserIds.length > 0) {
    console.log(`   (dry run) would delete ${oldUserIds.length} auth user(s)`);
  }

  // 5. Create the 3 new auth users + insert into technicians
  console.log(`\n➕ Creating ${NEW_TECHS.length} new technicien(s):`);
  for (const t of NEW_TECHS) {
    console.log(`\n   ▸ ${t.email}`);

    // If a user with that email already exists (leftover), remove first — safer than failing.
    const preExisting = await findAuthUserByEmail(t.email);
    if (preExisting) {
      console.log(`     ↪ pre-existing auth user ${preExisting.id} — will remove first`);
      if (APPLY) {
        // detach any technicians row pointing to it
        const { data: techRows } = await admin.from("technicians").select("id").eq("user_id", preExisting.id);
        if (techRows && techRows.length > 0) {
          const ids = techRows.map((r) => r.id);
          await admin.from("repair_requests").update({ technician_id: null }).in("technician_id", ids);
          await admin.from("technicians").delete().in("id", ids);
        }
        const { error: delErr } = await admin.auth.admin.deleteUser(preExisting.id);
        if (delErr) throw new Error(`delete pre-existing ${t.email} failed: ${delErr.message}`);
      }
    }

    if (!APPLY) {
      console.log(`     (dry run) would create auth user ${t.email} (password set) + technicien row`);
      continue;
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: t.email,
      password: t.password,
      email_confirm: true,
    });
    if (createErr) throw new Error(`create ${t.email} failed: ${createErr.message}`);
    const userId = created.user.id;
    console.log(`     ✅ auth user created  id=${userId}`);

    const { error: insErr } = await admin.from("technicians").insert({
      name: t.name,
      email: t.email,
      user_id: userId,
      color: COLOR,
      available: true,
    });
    if (insErr) throw new Error(`insert technicien row for ${t.email} failed: ${insErr.message}`);
    console.log(`     ✅ technicien row inserted  name="${t.name}"  color=${COLOR}`);
  }

  console.log(`\n✨ Done.\n`);
  if (!APPLY) console.log(`Run again with --apply to actually perform these changes.\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}\n`);
  process.exit(1);
});
