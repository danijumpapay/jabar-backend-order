import { Router } from "express";
import { getPromos } from "@controllers/catalog/catalog.controller";

const router = Router();

router.get("/", getPromos);

export default router;
