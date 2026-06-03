import { Router, type IRouter } from "express";
import { isNotifyType, sendFormNotification } from "../lib/mailer";

const router: IRouter = Router();

const MAX_SUBJECT = 300;
const MAX_BODY = 20_000;
const MAX_REPLYTO = 320;

// Limite anti-abus simple, par IP (best-effort, en mémoire / par instance).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

router.post("/notify", async (req, res, next) => {
  try {
    const ip = req.ip ?? "unknown";
    if (rateLimited(ip)) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }

    const { type, subject, body, replyTo } = req.body ?? {};

    if (!isNotifyType(type)) {
      res.status(400).json({ error: "Invalid type" });
      return;
    }
    if (typeof subject !== "string" || subject.trim().length === 0) {
      res.status(400).json({ error: "subject is required" });
      return;
    }
    if (typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "body is required" });
      return;
    }

    const result = await sendFormNotification({
      type,
      subject: subject.slice(0, MAX_SUBJECT),
      body: body.slice(0, MAX_BODY),
      replyTo:
        typeof replyTo === "string" && replyTo.length <= MAX_REPLYTO
          ? replyTo
          : undefined,
    });

    res.json({ ok: true, sent: result.sent });
  } catch (error) {
    next(error);
  }
});

export default router;
