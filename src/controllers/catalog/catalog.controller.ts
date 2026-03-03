import { Request, Response } from "express";
import { successResponse, errorResponse } from "@utils/response";
import { service, common } from "@jumpapay/jumpapay-models";
import dotenv from "dotenv";

dotenv.config();

export const getServices = async (_req: Request, res: Response): Promise<void> => {
    try {
        const services = await service.Services?.query()
            .select("id", "name as title", "description", "image", "price", "slug") as any[];

        res.status(200).json(successResponse("Data layanan berhasil diambil", { results: services || [] }));
    } catch (err: any) {
        console.error("GET SERVICES ERROR:", err);
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data layanan"));
    }
};

export const getPromos = async (_req: Request, res: Response): Promise<void> => {
    try {
        const promos = await common.Vouchers?.query()
            .select("id", "name as title", "description", "image")
            .where("is_active", true)
            .orderBy("created_at", "desc") as any[];

        res.status(200).json(successResponse("Data promo berhasil diambil", { results: promos || [] }));
    } catch (err: any) {
        console.error("GET PROMOS ERROR:", err);
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data promo"));
    }
};
