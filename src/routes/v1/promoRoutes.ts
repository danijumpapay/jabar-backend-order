import { Router } from "express";
import { getPromos } from "@controllers/catalog/catalog.controller";

const router = Router();

/** GET /api/v1/promos */
router.get("/", getPromos);

export default router;
