import { Request, Response } from "express";
import Joi from "joi";
import { successResponse, errorResponse } from "@utils/response";
import orderService from "@services/order/order.service";
import { CreateOrderRequest } from "@dataTypes/order";
import dotenv from "dotenv";

dotenv.config();

const COMPANY_ID = process.env.COMPANY_ID || "";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createOrderSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    whatsapp: Joi.string().min(8).required(),
    nik: Joi.string().length(16).required(),
    plateNumber: Joi.string().min(4).required(),
    no_rangka: Joi.string().min(5).required(),
    serviceId: Joi.string().required(),
    deliveryFee: Joi.number().min(0).required(),
    finalTotal: Joi.number().min(0).required(),
    address: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    addressNote: Joi.string().optional().allow(""),
    paymentMethod: Joi.string().required(),
    voucherCode: Joi.string().optional().allow(""),
    promoId: Joi.string().optional().allow(""),
    jenisKendaraan: Joi.string().optional(),
    jenisMutasi: Joi.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json(errorResponse("Validasi gagal", {
                errors: error.details.map((d) => ({ field: d.path.join("."), message: d.message }))
            }));
            return;
        }

        const data = value as CreateOrderRequest;
        const result = await orderService.createOrder(data, COMPANY_ID);

        res.status(201).json(successResponse("Order berhasil dibuat", { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "createOrder error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat membuat order"));
    }
};

/**
 * GET /api/v1/orders/:bookingId
 * Get order tracking detail by bookingId (e.g. KP2026xxxxx)
 */
export const getOrderByBookingId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;

        if (!bookingId) {
            res.status(400).json(errorResponse("Nomor order wajib diisi"));
            return;
        }

        const orderDetail = await orderService.getOrderDetail(bookingId);

        if (!orderDetail) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        res.status(200).json(successResponse("Data order berhasil diambil", { results: orderDetail }));
    } catch (err: any) {
        req.log?.error({ err }, "getOrderByBookingId error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data order"));
    }
};

/**
 * GET /api/v1/orders/:orderId/payment-status
 * Get payment status of an order by internal orderId (UUID)
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const paymentStatus = await orderService.getPaymentStatus(orderId);

        if (!paymentStatus) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        res.status(200).json(successResponse("Status pembayaran berhasil diambil", { results: paymentStatus }));
    } catch (err: any) {
        req.log?.error({ err }, "getPaymentStatus error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil status pembayaran"));
    }
};

/**
 * PATCH /api/v1/orders/:orderId/cancel
 * Cancel an order
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const result = await orderService.cancelOrder(orderId);

        if (!result) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        res.status(200).json(successResponse("Order berhasil dibatalkan"));
    } catch (err: any) {
        if (err.message?.includes("sudah dibayar")) {
            res.status(400).json(errorResponse(err.message));
            return;
        }
        req.log?.error({ err }, "cancelOrder error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat membatalkan order"));
    }
};

/**
 * POST /api/v1/orders/:orderId/refund
 * Submit a refund request
 */
export const createRefund = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const refundSchema = Joi.object({
            nominalAktual: Joi.number().min(1).required(),
            bank: Joi.string().required(),
            rekening: Joi.string().min(6).required(),
            catatan: Joi.string().optional().allow(""),
        });

        const { error, value } = refundSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json(errorResponse("Validasi gagal", {
                errors: error.details.map((d) => ({ field: d.path.join("."), message: d.message }))
            }));
            return;
        }

        const order = await orderService.getOrderById(orderId);
        if (!order) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        const result = await orderService.createRefund(orderId, value);
        res.status(200).json(successResponse("Pengajuan refund berhasil dikirim", { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "createRefund error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengajukan refund"));
    }
};
