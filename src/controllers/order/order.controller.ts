import { Request, Response } from "express";
import Joi from "joi";
import { successResponse, errorResponse } from "@utils/response";
import orderService from "@services/order/order.service";
import { CreateOrderRequest, RefundRequest } from "@dataTypes/order";
import dotenv from "dotenv";

dotenv.config();



const createOrderSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().min(8).required(),
    identityNumber: Joi.string().length(16).required(),
    plateNumber: Joi.string().min(4).required(),
    chassisNumber: Joi.string().min(5).required(),
    serviceId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    deliveryFee: Joi.number().min(0).required(),
    totalAmount: Joi.number().min(0).required(),
    address: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    addressNote: Joi.string().optional().allow(""),
    paymentMethod: Joi.string().required(),
    voucherCode: Joi.string().optional().allow(""),
    promoId: Joi.string().optional().allow(""),
    vehicleType: Joi.string().optional().allow("", "Mobil", "Motor", "Truk", "MOBIL", "MOTOR", "TRUK"),
    mutationType: Joi.string().optional().allow(""),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    isSamsatPickup: Joi.boolean().optional(),
    taxData: Joi.object().unknown(true).optional(),
}).unknown(true);

const refundSchema = Joi.object({
    actualAmount: Joi.number().min(1).required(),
    bank: Joi.string().required(),
    accountNumber: Joi.string().min(6).required(),
    notes: Joi.string().optional().allow(""),
});




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
        const companyId = process.env.COMPANY_ID || "";
        const result = await orderService.createOrder(data, companyId);

        res.status(201).json(successResponse("Order berhasil dibuat", { results: result }));
    } catch (err: any) {
        res.status(500).json(errorResponse("Terjadi kesalahan saat membuat order", {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }));
    }
};


export const getOrderByBookingId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;

        if (!bookingId) {
            res.status(400).json(errorResponse("Nomor booking order wajib diisi"));
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
        if (err.message?.includes("already paid")) {
            res.status(400).json(errorResponse(err.message));
            return;
        }
        req.log?.error({ err }, "cancelOrder error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat membatalkan order"));
    }
};


export const createRefund = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const { error, value } = refundSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json(errorResponse("Validasi gagal", {
                errors: error.details.map((d) => ({ field: d.path.join("."), message: d.message }))
            }));
            return;
        }

        const data = value as RefundRequest;
        const order = await orderService.getOrderById(orderId);
        if (!order) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        const result = await orderService.createRefund(orderId, data);
        res.status(200).json(successResponse("Permintaan refund berhasil dikirim", { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "createRefund error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengirim permintaan refund"));
    }
};


export const simulatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        req.log?.info({ orderId }, "Simulating payment from controller");
        const result = await orderService.simulatePayment(orderId);
        if (!result) {
            res.status(404).json(errorResponse("Order atau Tagihan tidak ditemukan"));
            return;
        }
        res.status(200).json(successResponse("Pembayaran berhasil disimulasikan", { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "simulatePayment error");
        res.status(500).json(errorResponse("Terjadi kesalahan simulasi"));
    }
};


export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { statusId } = req.body;

        const result = await orderService.updateOrderStatus(orderId, Number(statusId));
        if (!result) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        res.status(200).json(successResponse("Status order berhasil diperbarui", { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "updateOrderStatus error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat memperbarui status order"));
    }
};
