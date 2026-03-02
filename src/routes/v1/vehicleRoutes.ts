import { Router } from "express";
import { checkVehicle } from "@controllers/vehicle/vehicle.controller";

const router = Router();

/**
 * POST /api/v1/vehicle/check
 */
router.post("/check", checkVehicle);

export default router;
