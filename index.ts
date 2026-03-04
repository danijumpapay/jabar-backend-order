import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import routesV1 from "./src/routes/v1/index";
import { initializeModels } from "@jumpapay/jumpapay-models";
import knex from "@config/connection";
import { logger, Logger } from "@config/logger";
import { globalRateLimit, requireApiKey } from "@middlewares/securityMiddleware";
dotenv.config();


const app: Application = express();
const port = process.env.PORT || 3001;

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-dev-secret", "x-api-key"],
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

app.use(globalRateLimit);
app.use(requireApiKey);

app.use((req, _res, next) => {
  req.log = logger.child({
    method: req.method,
    path: req.url,
    ip: req.ip,
  });
  next();
});

initializeModels(knex);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    app: "jabar-backend-order",
    version: "1.0.0",
  });
});

app.use("/api/v1", routesV1);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(port, () => {
  logger.info(`Server started on http://localhost:${port}`);
});

export default app;