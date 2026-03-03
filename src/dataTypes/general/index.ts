import { transaction } from "@jumpapay/jumpapay-models";

export interface OrderData {
  id: string;
  user_id: string;
  order_status_id: number;
  booking_id: string;
  phone: string;
  source: string;
};

export interface CachedUser {
  id: string;
  name: string;
  phone: string;
};

export interface ServicesData {
  id: number;
  name: string;
  price: number;
  companyId?: string;
  isPublic: boolean;
  description: string;
  isLocationRequired: boolean;
  orderFormId: string;
  orderFormName: string;
  orderFormToken: string;
  orderFormScreen: string;
  orderFormCta: string;
  messageAfterOrder: string;
  documentsFormId: string;
  documentsFormName: string;
  documentsFormToken: string;
  documentsFormScreen: string;
  documentsFormCta: string;
  messageAfterDocuments: string;
};

export type MediaType = "text" | "image" | "video" | "audio" | "document" | "sticker" | "location" | "contacts" | "policy" | "button" | "list" | "payment" | "interactive" | "response" | "reply" | "call" | "link" | "unknown";

export interface ChatMessageContactName {
  first_name: string;
  last_name?: string;
  formatted_name?: string;
};

export interface ChatMessageContactPhone {
  phone: string;
  wa_id?: string;
  type?: string;
};

export interface ChatMessageContact {
  name: ChatMessageContactName;
  phones: ChatMessageContactPhone[];
};

export interface ChatHeader {
  type?: MediaType;
  contacts?: ChatMessageContact[];
  location?: {
    latitude: number;
    longitude: number;
  };
  sticker?: {
    id: string;
    url: string;
    animated: boolean;
  };
  image?: {
    id: string;
    url: string;
  };
  video?: {
    id: string;
    url: string;
  };
  audio?: {
    id: string;
    url: string;
  };
  document?: {
    id: string;
    url: string;
    filename: string;
  };
  unknown?: {
    id: string | number;
    text: string;
  };
}

export interface ChatBody {
  type: "text";
  text: string;
}

export interface ChatFooter {
  text: string;
}

export interface ChatMessage {
  id: string;
  ref_id?: string;
  room_id: string;
  phone_id: string;
  from: string;
  to: string;
  header?: ChatHeader;
  body: ChatBody;
  footer?: ChatFooter;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "STICKER" | "LOCATION" | "CONTACT" | "POLICY" | "BUTTON" | "LIST" | "PAYMENT" | "INTERACTIVE" | "RESPONSE" | "REPLY" | "CALL" | "LINK" | "UNKNOWN";
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  is_read: boolean;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  line: "IN" | "OUT";
}

export interface WhatsappMedia {
  url?: string;
  filename?: string;
}

export interface ChatMessageFromInternal {
  header?: ChatHeader;
  body: ChatBody;
  footer?: ChatFooter;
}

export interface Chat {
  id: string;
  phone_id?: string;
  phone?: string;
  name: string;
  avatar?: string | null;
  last_seen?: string | null;
  taken_by?: string | null;
  password?: string | null;
  is_read?: boolean;
  is_session_active?: boolean;
  last_message?: any | null;
  last_message_at?: string | null;
  deleted_at?: string | null;
  created_at?: Date;
  totalUnreadMessage?: number;
};

export interface Contacts {
  wa_id: string;
  profile: {
    name: string;
  };
};

export interface ChatUpdate {
  id: string;
  last_message?: any | null;
  last_message_at?: string | null;
};

export interface WhatsappMedia {
  url?: string;
  filename?: string;
};

export interface FlowData {
  version?: string;
  action?: string;
  token: string;
  name: string;
  cta: string;
  screen: string;
};


export interface WhatsappMediaFlow {
  id: number;
  mime_type: string;
  sha256: string;
  file_name: string;
};

type OrderAddress = transaction.OrderAddresses;
type OrderNote = transaction.OrderNotes;

interface OrderDetailDocumentData {
  id: string;
  uploadedBy: string;
  type: "STNK" | "BPKB" | "SKPD" | "KTP" | "OTHERS";
  document: string;
};

export interface OrderDetailData {
  id: string;
  serviceId: number;
  serviceName: string;
  isLocationRequired: boolean;
  vehicleId: string;
  vehicleType: string;
  platePrefix: string;
  plateNumber: string;
  plateSerial: string;
  price: number;
  documents: OrderDetailDocumentData[];
  whatsappFormId: string;
  whatsappFormName: string;
  whatsappFormToken: string;
  whatsappFormScreen: string;
  whatsappFormCTA: string;
};

export interface FullOrderData {
  orderId: string;
  userId: string;
  orderStatusId: number;
  bookingId: string;
  phone: string;
  source: string;
  cityId: number;
  cityName: string;
  paidAt: string;
  email: string;
  createdAt: string;
  orderStatus: string;
  details: OrderDetailData[];
  orderAddresses: OrderAddress[];
  notes: OrderNote[];
};

export interface MyOrdersList {
  id: string;
  title: string;
  description?: string;
};

export interface Contact {
  profile: {
    name: string;
  };
  wa_id?: string;
};

export interface Metadata {
  display_phone_number: string;
  phone_number_id: string;
};

export interface Pricing {
  billable: boolean;
  pricing_model: string;
  category: string;
  type: string;
};

export interface Conversation {
  id: string;
  expiration_timestamp?: string;
  origin: {
    type: string;
  };
};

export interface YM {
  year: number;
  month: number;
};

export interface FlipItemDetail {
  id: string;
  name: string;
  price: number;
  quantity: number;
  desc?: string;
  image_url?: string;
};

export interface FlipMinimumRequest {
  title: string;
  amount: number;
  name: string;
  email: string;
  refId?: string;
  isPhoneNumberRequired?: boolean;
  isAddressRequired?: boolean;
  redirectUrl?: string;
  expiredDate?: string;
  items?: FlipItemDetail[];
};

export interface ReceiverBankAccount {
  account_number: string | null;
  account_type: string;
  bank_code: string;
  account_holder: string;
  qr_code_data: string;
};

export interface BillPayment {
  id: string;
  amount: number;
  unique_code: number;
  status: string;
  sender_bank: string;
  sender_bank_type: string;
  receiver_bank_account: ReceiverBankAccount;
  user_address: string;
  user_phone: string;
  created_at: number;
};

export interface CustomerDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
};

export interface FlipQRISCreatedResponse {
  link_id: number;
  link_url: string;
  title: string;
  type: string;
  amount: number;
  redirect_url: string;
  expired_date: string | null;
  created_from: string;
  status: string;
  is_address_required: boolean;
  is_phone_number_required: boolean;
  step: string;
  customer: CustomerDetails;
  bill_payment: BillPayment;
  payment_url: string;
  charge_fee: boolean;
  company_code: string;
  product_code: string;
  reference_id: string;
};

export interface FlipResponsePaymentAccepted {
  amount: number;
  bill_link: string;
  bill_link_id: number;
  bill_title: string;
  created_at: string;
  id: string;
  reference_id: string;
  sender_bank: string;
  sender_bank_type: string;
  sender_email: string;
  sender_name: string;
  status: string;
  transaction_reference_number: string;
};

export interface SambaraInfoPKB {
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
};

export interface SambaraInfoPKBResponse {
  success: boolean;
  message: string;
  data: SambaraInfoPKB | null;
}

type CityId = number | string;
type VehicleId = number | string;
type PickupMethodId = 1 | 2 | 3;
type PickupPrice = number;

export type PickupMethodPricing= {
  [S in PickupMethodId]: PickupPrice
};

export type CityPickupPricing = {
  [key: VehicleId]: PickupMethodPricing
};

export type CitiesPricing = {
  [key: CityId]: CityPickupPricing
};

interface DynamicObject {
  [key: string]: string | number | boolean | null | undefined | DynamicObject | DynamicObject[];
};

export { DynamicObject };