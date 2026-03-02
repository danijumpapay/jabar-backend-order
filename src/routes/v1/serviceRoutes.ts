import { Router } from "express";
import { getServices } from "@controllers/catalog/catalog.controller";

const router = Router();

/** GET /api/v1/services */
router.get("/", getServices);

export default router;
