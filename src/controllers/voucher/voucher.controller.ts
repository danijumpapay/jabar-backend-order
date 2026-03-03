import { Request, Response } from "express";
import { successResponse, errorResponse } from "@utils/response";
import voucherService from "@services/voucher/voucher.service";
import Joi from "joi";

export const validateVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const schema = Joi.object({
            code: Joi.string().min(1).required(),
            orderId: Joi.string().optional(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json(errorResponse("Kode voucher harus diisi"));
            return;
        }

        const result = await voucherService.validate(value);

        if (!result.valid) {
            res.status(400).json(errorResponse(result.message));
            return;
        }

        res.status(200).json(successResponse(result.message, { results: result }));
    } catch (err: any) {
        req.log?.error({ err }, "validateVoucher error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat memvalidasi voucher"));
    }
};
