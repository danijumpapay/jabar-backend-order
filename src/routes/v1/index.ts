import { Router } from "express";
import orderRoutes from "./orderRoutes";
import voucherRoutes from "./voucherRoutes";
import vehicleRoutes from "./vehicleRoutes";
import serviceRoutes from "./serviceRoutes";
import promoRoutes from "./promoRoutes";
import authRoutes from "./authRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/vouchers", voucherRoutes);
router.use("/vehicle", vehicleRoutes);
router.use("/services", serviceRoutes);
router.use("/promos", promoRoutes);

export default router;
