// ─── Order ────────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
    name: string;
    email: string;
    whatsapp: string;
    nik: string;
    plateNumber: string;
    no_rangka: string;
    serviceId: string;
    deliveryFee: number;
    finalTotal: number;
    address?: string;
    city?: string;
    addressNote?: string;
    paymentMethod: string;
    voucherCode?: string;
    promoId?: string;
    jenisKendaraan?: string;
    jenisMutasi?: string;
}

export interface OrderStatusStep {
    title: string;
    completed: boolean;
}

export interface OrderDetailResponse {
    orderId: string;
    bookingId: string;
    status: string;
    orderStatusId: number;
    nama: string;
    email: string;
    layanan: string;
    harga: string;
    tanggal: string;
    steps: OrderStatusStep[];
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface PaymentStatusResponse {
    paid: boolean;
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
    paidAt?: string | null;
}

// ─── Voucher ──────────────────────────────────────────────────────────────────

export type VoucherType = "DISCOUNT" | "ONGKIR";

export interface VoucherValidateRequest {
    code: string;
    orderId?: string;
}

export interface VoucherValidateResponse {
    valid: boolean;
    type?: VoucherType;
    discountPercent?: number;
    message: string;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface RefundRequest {
    nominalAktual: number;
    bank: string;
    rekening: string;
    catatan?: string;
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export interface DocumentUploadResult {
    ktp?: string | null;
    stnk?: string | null;
    bpkb?: string | null;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export interface ServiceItem {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string;
    description: string;
    isActive: boolean;
}

// ─── Promo ────────────────────────────────────────────────────────────────────

export interface PromoItem {
    id: string;
    title: string;
    image: string;
    description: string;
    isActive: boolean;
}
