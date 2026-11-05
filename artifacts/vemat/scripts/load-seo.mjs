// Charge src/seo/landing.ts (TypeScript, alias @/) depuis un script Node, via Vite en mode SSR.
import { createServer } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function loadSeo() {
  const server = await createServer({
    root,
    configFile: resolve(root, "vite.config.ts"),
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: "custom",
    logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const mod = await server.ssrLoadModule("/src/seo/landing.ts");
    // On détache les données avant de fermer le serveur.
    return { mod, close: () => server.close() };
  } catch (e) {
    await server.close();
    throw e;
  }
}
