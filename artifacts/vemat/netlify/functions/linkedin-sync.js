/**
 * Netlify function: linkedin-sync
 *
 * Receives a POST webhook from Make.com containing a new LinkedIn post object,
 * prepends it to public/linkedin-posts.json via the GitHub API, and
 * lets Netlify's GitHub integration trigger an automatic redeploy.
 *
 * Required environment variables (set in Netlify UI → Site settings → Env vars):
 *   GITHUB_TOKEN   — Personal access token with repo write access
 *   GITHUB_OWNER   — GitHub username or org (e.g. "vemat-group")
 *   GITHUB_REPO    — Repository name (e.g. "vemat-website")
 *   GITHUB_BRANCH  — Branch to commit to (default: "main")
 *   WEBHOOK_SECRET — Optional shared secret; Make.com must send it as
 *                    the "x-webhook-secret" header for basic auth
 *
 * Expected POST body (JSON):
 * {
 *   "id": "li-11",
 *   "slug": "linkedin-some-unique-slug",
 *   "title": { "fr": "Titre FR", "en": "Title EN" },
 *   "excerpt": { "fr": "Extrait FR", "en": "Excerpt EN" },
 *   "content": { "fr": "Contenu FR", "en": "Content EN" },
 *   "image": "/images/blog/some-image.jpg",
 *   "date": "2025-05-01",
 *   "category": "LinkedIn",
 *   "author": "Vemat Group",
 *   "linkedinUrl": "https://www.linkedin.com/feed/update/urn:li:activity:...",
 *   "source": "linkedin"
 * }
 */

const FILE_PATH = "artifacts/vemat/public/linkedin-posts.json";
const MAX_POSTS = 50;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Optional webhook secret validation
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && event.headers["x-webhook-secret"] !== secret) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let newPost;
  try {
    newPost = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  // Validate minimum required fields
  if (!newPost.id || !newPost.slug || !newPost.title?.fr || !newPost.date) {
    return { statusCode: 400, body: "Missing required fields: id, slug, title.fr, date" };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: "Missing GitHub environment variables" };
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // 1. Fetch current file from GitHub
  let sha, currentPosts;
  try {
    const res = await fetch(`${apiBase}?ref=${branch}`, { headers });
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    const data = await res.json();
    sha = data.sha;
    currentPosts = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
  } catch (err) {
    return { statusCode: 502, body: `Failed to read current file: ${err.message}` };
  }

  // 2. Avoid duplicate posts
  const alreadyExists = currentPosts.posts.some((p) => p.id === newPost.id || p.slug === newPost.slug);
  if (alreadyExists) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true, reason: "duplicate" }) };
  }

  // 3. Prepend new post and trim to MAX_POSTS
  currentPosts.posts.unshift(newPost);
  currentPosts.posts = currentPosts.posts.slice(0, MAX_POSTS);

  const updatedContent = Buffer.from(JSON.stringify(currentPosts, null, 2)).toString("base64");

  // 4. Commit back to GitHub
  try {
    const res = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `chore: add LinkedIn post ${newPost.id}`,
        content: updatedContent,
        sha,
        branch,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub PUT failed: ${res.status} — ${body}`);
    }
  } catch (err) {
    return { statusCode: 502, body: `Failed to commit file: ${err.message}` };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, id: newPost.id }),
  };
};
