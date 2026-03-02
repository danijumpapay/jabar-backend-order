import { Request, Response } from "express";
import { successResponse, errorResponse } from "@utils/response";
import { service, common } from "@jumpapay/jumpapay-models";
import dotenv from "dotenv";

dotenv.config();

const COMPANY_ID = process.env.COMPANY_ID || "";

/**
 * GET /api/v1/services
 * Daftar layanan yang tersedia untuk ditampilkan di halaman Home frontend
 */
export const getServices = async (_req: Request, res: Response): Promise<void> => {
    try {
        const services = await service.Services?.query()
            .select("id", "name as title", "description", "image", "price", "slug")
            .where("company_id", COMPANY_ID) as any[];

        res.status(200).json(successResponse("Data layanan berhasil diambil", { results: services || [] }));
    } catch (err: any) {
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data layanan"));
    }
};

/**
 * GET /api/v1/promos
 * Daftar promo aktif untuk ditampilkan di slider halaman Home frontend
 */
export const getPromos = async (_req: Request, res: Response): Promise<void> => {
    try {
        const promos = await common.Vouchers?.query()
            .select("id", "name as title", "description", "image")
            .where("company_id", COMPANY_ID)
            .where("is_active", true)
            .orderBy("created_at", "desc") as any[];

        res.status(200).json(successResponse("Data promo berhasil diambil", { results: promos || [] }));
    } catch (err: any) {
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data promo"));
    }
};
