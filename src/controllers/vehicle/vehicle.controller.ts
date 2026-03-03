import { Request, Response } from "express";
import { successResponse, errorResponse } from "@utils/response";
import sambaraService from "@services/sambara/sambara.service";
import Joi from "joi";

export const checkVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const schema = Joi.object({
            plat: Joi.string().min(4).required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json(errorResponse("Plat nomor wajib diisi"));
            return;
        }

        const result = await sambaraService.infoPKB(value.plat);

        if (!result.success) {
            res.status(400).json(errorResponse(result.message));
            return;
        }

        res.status(200).json(successResponse("Data kendaraan berhasil diambil", { data: result.data }));
    } catch (err: any) {
        req.log?.error({ err }, "checkVehicle error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengambil data kendaraan"));
    }
};
