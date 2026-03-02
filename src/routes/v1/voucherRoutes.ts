import { Router } from "express";
import { validateVoucher } from "@controllers/voucher/voucher.controller";

const router = Router();

/**
 * POST /api/v1/vouchers/validate
 */
router.post("/validate", validateVoucher);

export default router;
