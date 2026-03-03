/// <reference path="./src/types/express.d.ts" />
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import routesV1 from "./src/routes/v1/index";
import { initializeModels } from "@jumpapay/jumpapay-models";
import knex from "@config/connection";
import { logger, Logger } from "@config/logger";
dotenv.config();

// Initialize express app

const app: Application = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cors());

// Attach logger to every request
app.use((req, _res, next) => {
  req.log = logger.child({
    method: req.method,
    path: req.url,
    ip: req.ip,
  });
  next();
});

// Initialize DB models
initializeModels(knex);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    app: "jabar-backend-order",
    version: "1.0.0",
  });
});

app.use("/api/v1", routesV1);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(port, () => {
  logger.info(`Server started on http://localhost:${port}`);
});

export default app;