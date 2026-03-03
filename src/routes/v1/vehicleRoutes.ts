import { Router } from "express";
import { checkVehicle } from "@controllers/vehicle/vehicle.controller";

const router = Router();

router.post("/check", checkVehicle);

export default router;
