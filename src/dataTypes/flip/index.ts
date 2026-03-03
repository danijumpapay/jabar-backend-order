
export interface Customer {
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
};

export interface QRISReceiverBankAccount {
  account_number: string | null;
  account_type: string;
  bank_code: string;
  account_holder: string;
  qr_code_data: string;
};

export interface GeneralReceiverBankAccount {
  account_number: string | null;
  account_type: string;
  bank_code: string;
  account_holder: string;
};

export type ReceiverBankAccount = QRISReceiverBankAccount | GeneralReceiverBankAccount;

export interface BillPayment {
  id: string;
  amount: number;
  unique_code: number;
  status: string;
  sender_bank: string;
  sender_bank_type: string;
  user_address: string | null;
  user_phone: string | null;
  created_at: number;
};

export interface BillPaymentQRIS extends BillPayment {
  receiver_bank_account: QRISReceiverBankAccount;
};

export interface BillPaymentGeneral extends BillPayment {
  receiver_bank_account: GeneralReceiverBankAccount;
};

export interface Data {
  link_id: number;
  link_url: string;
  title: string;
  type: string;
  amount: number;
  redirect_url: string;
  expired_date: string;
  created_from: string;
  status: string;
  is_address_required: boolean;
  is_phone_number_required: boolean;
  step: string;
  customer: Customer;
  payment_url: string;
  company_code: string;
  product_code: string;
  reference_id: string;
};

export interface DataQRIS extends Data {
  bill_payment: BillPaymentQRIS;
};

export interface DataGeneral extends Data {
  bill_payment: BillPaymentGeneral;
};

export interface FlipCreatedResponse {
  success: boolean;
  message: string;
};

export interface FlipQRISCreatedResponse extends FlipCreatedResponse {
  data: DataQRIS | null;
};

export interface FlipGeneralCreatedResponse extends FlipCreatedResponse {
  data: DataGeneral | null;
};