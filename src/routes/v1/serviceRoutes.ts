import { Router } from "express";
import { getServices } from "@controllers/catalog/catalog.controller";

const router = Router();

router.get("/", getServices);

export default router;
