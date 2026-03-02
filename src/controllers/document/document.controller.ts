import { Request, Response } from "express";
import { successResponse, errorResponse } from "@utils/response";
import uploadService from "@services/upload/upload.service";
import { transaction } from "@jumpapay/jumpapay-models";
import { logger } from "@config/logger";
import orderService from "@services/order/order.service";

/**
 * POST /api/v1/orders/:orderId/documents
 * Upload KTP, STNK, BPKB for an order.
 * Expects multipart/form-data with fields: ktp, stnk, bpkb
 */
export const uploadDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        // Verify order exists
        const order = await orderService.getOrderById(orderId);
        if (!order) {
            res.status(404).json(errorResponse("Order tidak ditemukan"));
            return;
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || (!files.ktp && !files.stnk && !files.bpkb)) {
            res.status(400).json(errorResponse("Tidak ada file yang diupload"));
            return;
        }

        const uploadResults: Record<string, string> = {};

        if (files.ktp?.[0]) {
            uploadResults.ktp = await uploadService.uploadBuffer(
                files.ktp[0].buffer,
                files.ktp[0].originalname,
                `orders/${orderId}/documents`
            );
        }
        if (files.stnk?.[0]) {
            uploadResults.stnk = await uploadService.uploadBuffer(
                files.stnk[0].buffer,
                files.stnk[0].originalname,
                `orders/${orderId}/documents`
            );
        }
        if (files.bpkb?.[0]) {
            uploadResults.bpkb = await uploadService.uploadBuffer(
                files.bpkb[0].buffer,
                files.bpkb[0].originalname,
                `orders/${orderId}/documents`
            );
        }

        // Update order_details with document URLs
        await transaction.OrderDetails.query()
            .patch({ document_urls: JSON.stringify(uploadResults) } as any)
            .where("order_id", orderId);

        logger.info({ orderId, uploadResults }, "Documents uploaded");

        res.status(200).json(successResponse("Dokumen berhasil diunggah", { results: uploadResults }));
    } catch (err: any) {
        req.log?.error({ err }, "uploadDocuments error");
        res.status(500).json(errorResponse("Terjadi kesalahan saat mengunggah dokumen"));
    }
};
