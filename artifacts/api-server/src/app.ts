import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Cloud Run place un proxy devant l'application : sans ceci, req.ip serait
// l'adresse du proxy et la limitation par IP s'appliquerait à tous les visiteurs.
app.set("trust proxy", 1);

const DEFAULT_ORIGINS = ["https://www.vematgroup.com", "https://vematgroup.com"];
const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (configuredOrigins.length === 0) {
  logger.warn("CORS_ORIGIN non défini : seules les origines vematgroup.com par défaut sont autorisées.");
}
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ORIGINS;
const isDev = process.env.NODE_ENV !== "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      const isLocal = isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? "");
      if (!origin || isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  }),
);
// Les rapports techniciens embarquent des photos (déjà compressées) : limite relevée sur cette seule route.
// Cloud Run plafonne de toute façon une requête à 32 Mo.
app.use("/api/reports", express.json({ limit: "28mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
