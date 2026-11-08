import { Router, type IRouter } from "express";
import { requireCatalogueAccess } from "../middlewares/requireCatalogueAccess";
import { getSupabaseForUser } from "../lib/supabaseServer";
import { sendReportEmail } from "../lib/mailer";
import { createRateLimiter } from "../lib/rateLimit";
import { logger } from "../lib/logger";
import { buildInterventionXlsx } from "../lib/reports/interventionXlsx";
import { buildInterventionPdf } from "../lib/reports/interventionPdf";
import { validateInterventionBody } from "../lib/reports/validate";
import { fmtDate, fmtMinutes, totals } from "../lib/reports/time";

const router: IRouter = Router();

// 20 envois / minute / IP : largement suffisant pour une équipe, bloque les abus.
const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

function safeFile(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 40) || "rapport";
}

router.post("/reports/intervention", limiter, requireCatalogueAccess, async (req, res) => {
  const user = req.catalogueUser!;
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "").trim();

  const parsed = validateInterventionBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { report, id } = parsed;
  const db = getSupabaseForUser(token);

  try {
    // Idempotence : un rapport déjà envoyé n'est jamais renvoyé (reprise après coupure réseau).
    const { data: existing } = await db
      .from("intervention_reports")
      .select("status, report_no")
      .eq("id", id)
      .maybeSingle();
    if (existing?.status === "sent") {
      res.json({ ok: true, duplicate: true, reportNo: existing.report_no });
      return;
    }
    // Données sans photos ni signatures (volumineuses) pour l'historique.
    const { photos, signatureTech: _st, signatureClient: _sc, ...light } = report;
    void _st;
    void _sc;
    const row = {
      id,
      user_id: user.id,
      report_no: report.reportNo,
      technician_name: report.technicien || null,
      client: report.client,
      status: "pending" as const,
      error: null,
      photo_count: photos.length,
      data: light,
    };
    const saved = existing
      ? await db.from("intervention_reports").update({ status: "pending", error: null, report_no: report.reportNo, client: report.client, technician_name: report.technicien || null, photo_count: photos.length, data: light }).eq("id", id)
      : await db.from("intervention_reports").insert(row);
    if (saved.error) {
      logger.error({ err: saved.error.message }, "Enregistrement du rapport impossible");
      res.status(500).json({ error: "Enregistrement du rapport impossible" });
      return;
    }

    try {
      const [pdf, xlsx] = await Promise.all([buildInterventionPdf(report), buildInterventionXlsx(report)]);
      const base = `Rapport_intervention_${report.reportNo}_${safeFile(report.client)}`;
      const t = totals(report.rows);
      const firstDate = report.rows.find((r) => r.date)?.date ?? "";
      const body = [
        `Rapport d'intervention N° ${report.reportNo}`,
        "",
        `Technicien : ${report.technicien || "—"}`,
        `Client : ${report.client}`,
        report.chantier ? `Chantier : ${report.chantier}` : "",
        report.modele || report.serie ? `Machine : ${[report.modele, report.serie].filter(Boolean).join(" / ")}` : "",
        report.otNo ? `OT : ${report.otNo}` : "",
        firstDate ? `Date : ${fmtDate(firstDate)}` : "",
        t.work || t.travel ? `Temps : travail ${fmtMinutes(t.work) || "0"} — voyage/préparation ${fmtMinutes(t.travel) || "0"}` : "",
        report.garantie === true ? "Garantie : oui" : report.garantie === false ? "Garantie : non" : "",
        report.travauxRestant === true ? "Travaux restants : OUI" : "",
        report.photos.length ? `Photos : ${report.photos.length}` : "",
        "",
        "Le rapport complet est en pièces jointes (PDF + Excel).",
      ]
        .filter((l, i, a) => l !== "" || a[i - 1] !== "")
        .join("\n");

      await sendReportEmail({
        subject: `Rapport d'intervention ${report.reportNo} — ${report.client}`,
        body,
        replyTo: user.email,
        attachments: [
          { filename: `${base}.pdf`, content: pdf, contentType: "application/pdf" },
          {
            filename: `${base}.xlsx`,
            content: xlsx,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message, id }, "Envoi du rapport échoué");
      await db.from("intervention_reports").update({ status: "failed", error: message.slice(0, 300) }).eq("id", id);
      res.status(502).json({ error: "Envoi de l'e-mail impossible, le rapport reste sur le téléphone" });
      return;
    }

    await db.from("intervention_reports").update({ status: "sent", sent_at: new Date().toISOString(), error: null }).eq("id", id);
    res.json({ ok: true, reportNo: report.reportNo });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Erreur rapport d'intervention");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
