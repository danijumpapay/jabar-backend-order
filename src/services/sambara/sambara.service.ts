import integrationInstance from "@config/integration";
import { logger } from "@config/logger";

export interface VehicleTaxData {
    WILAYAH_SAMSAT: string;
    NO_POLISI: string;
    NO_RANGKA: string;
    NO_MESIN: string;
    NO_KTP: string;
    MILIK_KE: string;
    NM_MEREK_KB: string;
    NM_MODEL_KB: string;
    WARNA_KB: string;
    THN_BUAT: string;
    TGL_AKHIR_PAJAK: string;
    TGL_AKHIR_STNKB: string;
    BBN_POKOK: string;
    BBN_DENDA: string;
    OPSEN_POKOK: string;
    OPSEN_DENDA: string;
    PKB_POKOK: string;
    PKB_DENDA: string;
    SWD_POKOK: string;
    SWD_DENDA: string;
    ADM_STNK: string;
    ADM_TNKB: string;
    JUMLAH_BAYAR: string;
    CAN_BE_PAID: boolean;
    ENABLE_POST_PAYMENT: boolean;
}

export interface SambaraResponse {
    success: boolean;
    message: string;
    data: VehicleTaxData | null;
}

const sambaraInstance = integrationInstance();

const sambaraService = {
    async infoPKB(plate: string): Promise<SambaraResponse> {
        try {
            const normalizedPlate = plate.replace(/\s/g, "").toUpperCase();
            const response = await sambaraInstance.post<SambaraResponse>(
                "v1/sambara/info-pkb",
                { plat: normalizedPlate }
            );
            return response.data;
        } catch (error) {
            logger.error({ error }, "Failed to call Sambara infoPKB");
            return { success: false, message: "Gagal mengambil data kendaraan", data: null };
        }
    },
};

export default sambaraService;
