import { common } from "@jumpapay/jumpapay-models";
import { VoucherValidateRequest, VoucherValidateResponse, VoucherType } from "@dataTypes/order";

// ─── Hardcoded vouchers (replace with DB query when voucher table is available) ─

interface VoucherRecord {
    code: string;
    type: VoucherType;
    discountPercent?: number;
    isActive: boolean;
}

const VOUCHERS: VoucherRecord[] = [
    { code: "KANGPAJAK10", type: "DISCOUNT", discountPercent: 10, isActive: true },
    { code: "ONGKIRGRATIS", type: "ONGKIR", isActive: true },
];

const voucherService = {
    async validate(data: VoucherValidateRequest): Promise<VoucherValidateResponse> {
        const code = data.code.trim().toUpperCase();
        const voucher = VOUCHERS.find((v) => v.code === code && v.isActive);

        if (!voucher) {
            return { valid: false, message: "Kode voucher tidak valid atau sudah tidak berlaku" };
        }

        return {
            valid: true,
            type: voucher.type,
            discountPercent: voucher.discountPercent,
            message: voucher.type === "ONGKIR"
                ? "Voucher gratis ongkir berhasil diterapkan"
                : `Voucher diskon ${voucher.discountPercent}% berhasil diterapkan`,
        };
    },
};

export default voucherService;
