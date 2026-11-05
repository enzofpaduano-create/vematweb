import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Limiteur simple en mémoire, par IP (par instance Cloud Run).
 * Suffisant contre l'abus basique ; pas un pare-feu.
 * Nécessite app.set("trust proxy", 1) pour voir la vraie IP derrière Cloud Run.
 */
export function createRateLimiter(opts: { windowMs: number; max: number }): RequestHandler {
  const hits = new Map<string, number[]>();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of hits) {
      const recent = times.filter((t) => now - t < opts.windowMs);
      if (recent.length === 0) hits.delete(ip);
      else hits.set(ip, recent);
    }
  }, opts.windowMs);
  timer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < opts.windowMs);
    recent.push(now);
    hits.set(ip, recent);
    if (recent.length > opts.max) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
