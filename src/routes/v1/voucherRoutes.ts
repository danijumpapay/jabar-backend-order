import { Router } from "express";
import { validateVoucher } from "@controllers/voucher/voucher.controller";

const router = Router();

router.post("/validate", validateVoucher);

export default router;
