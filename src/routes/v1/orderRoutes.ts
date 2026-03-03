import { Router } from "express";
import multer from "multer";
import {
    createOrder,
    getOrderByBookingId,
    getPaymentStatus,
    cancelOrder,
    createRefund,
    simulatePayment,
    updateOrderStatus,
} from "@controllers/order/order.controller";
import { uploadDocuments } from "@controllers/document/document.controller";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF"));
        }
    },
});

const devOnly = (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV === "production" && !req.headers["x-dev-secret"]) {
        return res.status(403).json({ success: false, message: "Akses ditolak pada mode produksi" });
    }
    next();
};


router.post("/", createOrder);
router.get("/:bookingId", getOrderByBookingId);
router.get("/:orderId/payment-status", getPaymentStatus);
router.post("/:orderId/simulate-payment", devOnly, simulatePayment);
router.patch("/:orderId/status", devOnly, updateOrderStatus);
router.patch("/:orderId/cancel", cancelOrder);
router.post("/:orderId/refund", createRefund);
router.post(
    "/:orderId/documents",
    upload.fields([
        { name: "ktp", maxCount: 1 },
        { name: "stnk", maxCount: 1 },
        { name: "bpkb", maxCount: 1 },
    ]),
    uploadDocuments
);

export default router;
