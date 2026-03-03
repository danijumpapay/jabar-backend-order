
export interface CreateOrderRequest {
    name: string;
    email: string;
    phoneNumber: string;
    identityNumber: string;
    plateNumber: string;
    chassisNumber: string;
    serviceId: string | number;
    deliveryFee: number;
    totalAmount: number;
    address?: string;
    city?: string;
    addressNote?: string;
    paymentMethod: string;
    voucherCode?: string;
    promoId?: string;
    vehicleType?: string;
    mutationType?: string;
    latitude?: number;
    longitude?: number;
    isSamsatPickup?: boolean;
    taxData?: {
        PKB_POKOK: string;
        PKB_DENDA: string;
        SWD_POKOK: string;
        SWD_DENDA: string;
        ADM_STNK: string;
        ADM_TNKB: string;
        OPSEN_POKOK: string;
        OPSEN_DENDA: string;
        JUMLAH_BAYAR: string;
        TGL_AKHIR_PAJAK: string;
        TGL_AKHIR_STNKB: string;
        WILAYAH_SAMSAT?: string;
        [key: string]: any;
    };
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
    name: string;
    email: string;
    serviceName: string;
    totalAmount: string;
    orderDate: string;
    steps: OrderStatusStep[];
}


export interface PaymentStatusResponse {
    paid: boolean;
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
    paidAt?: string | null;
}


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


export interface RefundRequest {
    actualAmount: number;
    bank: string;
    accountNumber: string;
    notes?: string;
}


export interface DocumentUploadResult {
    ktp?: string | null;
    stnk?: string | null;
    bpkb?: string | null;
}


export interface ServiceItem {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string;
    description: string;
    isActive: boolean;
}


export interface PromoItem {
    id: string;
    title: string;
    image: string;
    description: string;
    isActive: boolean;
}
