import { Router } from "express";
import multer from "multer";
import {
    createOrder,
    getOrderByBookingId,
    getPaymentStatus,
    cancelOrder,
    createRefund,
} from "@controllers/order/order.controller";
import { uploadDocuments } from "@controllers/document/document.controller";

const router = Router();

// Use memory storage so files are available as buffers for S3 upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF"));
        }
    },
});

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post("/", createOrder);

/**
 * GET /api/v1/orders/:bookingId
 * Get order tracking by bookingId (e.g. KP20260301xxxx)
 */
router.get("/:bookingId", getOrderByBookingId);

/**
 * GET /api/v1/orders/:orderId/payment-status
 * Check payment status of an order
 */
router.get("/:orderId/payment-status", getPaymentStatus);

/**
 * PATCH /api/v1/orders/:orderId/cancel
 * Cancel an order
 */
router.patch("/:orderId/cancel", cancelOrder);

/**
 * POST /api/v1/orders/:orderId/refund
 * Submit refund request
 */
router.post("/:orderId/refund", createRefund);

/**
 * POST /api/v1/orders/:orderId/documents
 * Upload KTP, STNK, BPKB documents
 */
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
