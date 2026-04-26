/**
 * Netlify function: update-stock
 *
 * Receives a parsed catalog JSON from the Admin page and commits it to
 * the GitHub repository, triggering an automatic Netlify/Cloudflare rebuild.
 *
 * POST body: { password: string, catalog: VematCatalog }
 *
 * Required env vars (Netlify UI → Site settings → Environment variables):
 *   ADMIN_PASSWORD  — password entered by Vemat staff
 *   GITHUB_TOKEN    — Personal Access Token with "repo" write scope
 *   GITHUB_REPO     — "owner/repo-name"  (e.g. "enzopaduano/vematweb")
 *
 * Optional:
 *   GITHUB_BRANCH   — target branch (default: "main")
 */

const FILE_PATH = "artifacts/vemat/public/vemat-stock-catalog.json";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(statusCode, body) {
  return { statusCode, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "JSON invalide" });
  }

  const { password, catalog } = body;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return json(503, { error: "ADMIN_PASSWORD non configuré" });
  if (password !== adminPassword) return json(401, { error: "Mot de passe incorrect" });

  if (!catalog || typeof catalog !== "object") return json(400, { error: "Catalogue manquant" });

  // ── GitHub config ─────────────────────────────────────────────────────────
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) return json(503, { error: "GITHUB_TOKEN / GITHUB_REPO non configurés" });

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${FILE_PATH}`;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "vemat-admin",
  };

  // ── Get current file SHA (required for update) ────────────────────────────
  let currentSha;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: authHeaders });
    if (getRes.ok) {
      const data = await getRes.json();
      currentSha = data.sha;
    }
  } catch {
    // File might not exist yet — that's fine, we'll create it
  }

  // ── Encode and commit ─────────────────────────────────────────────────────
  const content = Buffer.from(JSON.stringify(catalog, null, 2), "utf-8").toString("base64");
  const date = new Date().toISOString().slice(0, 10);

  const putBody = {
    message: `update vemat stock catalog — ${date}`,
    content,
    branch,
    ...(currentSha ? { sha: currentSha } : {}),
  };

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    console.error("GitHub PUT failed:", putRes.status, errText);
    return json(502, { error: `Erreur GitHub ${putRes.status}: ${errText.slice(0, 200)}` });
  }

  return json(200, { ok: true, date });
};
