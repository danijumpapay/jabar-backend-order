
export interface MidtransTransactionDetails {
    gross_amount: number;
    order_id: string;
}

export interface MidtransCustomerDetails {
    email?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}

export interface BankText {
    id: string;
    en: string;
}

export interface MidtransBankFreeText {
    inquiry?: BankText[];
    payment?: BankText[];
}

export interface MidtransBankTransfer {
    bank: string;
    va_number?: string;
    free_text?: MidtransBankFreeText;
}

export interface MidtransItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
}

export type MidtransExpiryUnit = "hour" | "minute";

export interface MidtransExpiryResult {
    expiry_duration: number;
    unit: MidtransExpiryUnit;
}

export interface MidtransBankTransferRequest {
    payment_type: string;
    transaction_details: MidtransTransactionDetails;
    customer_details: MidtransCustomerDetails;
    item_details?: MidtransItemDetail[];
    bank_transfer: MidtransBankTransfer;
    custom_expiry?: MidtransExpiryResult;
}

export interface MidtransVABankNumber {
    bank: string;
    va_number: string;
}

export interface MidtransVaNumber {
    va_number: string;
    bank: string;
}

export interface MidtransPaymentAmount {
    amount: string;
    paid_at: string;
}

export interface MidtransNotificationCustomerDetails {
    phone?: string;
    full_name?: string;
}

export interface MidtransNotification {
    va_numbers?: MidtransVaNumber[];
    transaction_time: string;
    transaction_status: string;
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key: string;
    settlement_time?: string;
    payment_type: string;
    payment_amounts?: MidtransPaymentAmount[];
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    fraud_status: string;
    expiry_time?: string;
    customer_details?: MidtransNotificationCustomerDetails;
    currency: string;
}

export interface MidtransCreateTransactionResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    currency: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
    va_numbers?: MidtransVaNumber[];
    expiry_time?: string;
}

export interface MidtransErrorResponse406 {
    status_code: "406";
    status_message: string;
    id: string;
}

export interface MidtransCreateResponse201 {
    status_code: "201";
    status_message: string;
    transaction_id: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    currency: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
    va_numbers: MidtransVABankNumber[];
    expiry_time?: string;
}

export type MidtransCreateResponse =
    | MidtransCreateResponse201
    | MidtransErrorResponse406;

export interface MidtransMinimumVARequest {
    amount: number;
    refId: string;
    email?: string;
    name?: string;
    phone?: string;
    bank: string;
    itemDetails?: MidtransItemDetail;
    freeText?: MidtransBankFreeText;
    customField1?: string;
    customField2?: string;
    customField3?: string;
    expiredDate: string;
}

export interface MidtransCreatedResponse {
    success: boolean;
    message: string;
};

export interface MidtransVACreatedResponse extends MidtransCreatedResponse {
    data: MidtransCreateTransactionResponse | null;
};
