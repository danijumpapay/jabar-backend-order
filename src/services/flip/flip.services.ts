import { FlipMinimumRequest } from "../../dataTypes/general";
import { FlipQRISCreatedResponse, FlipGeneralCreatedResponse } from "../../dataTypes/flip";
import integrationInstance from "@config/integration";

const flipInstance = integrationInstance();

export class FlipService {
  async createQRIS(data: FlipMinimumRequest): Promise<FlipQRISCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipQRISCreatedResponse>("v1/flip/create/qris", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });
      return execution.data;
    } catch (error: any) {
      console.log("QRIS ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create QRIS",
        data: null
      };
    }
  }

  async createShopeePay(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/shopee-pay", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });

      return execution.data;
    } catch (error: any) {
      console.log("SHOPEEPAY ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create ShopeePay",
        data: null
      };
    }
  }

  async createDana(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/dana", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });

      return execution.data;
    } catch (error: any) {
      console.log("DANA ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create Dana",
        data: null
      };
    }
  }

  async createOvo(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/ovo", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });

      return execution.data;
    } catch (error: any) {
      console.log("OVO ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create OVO",
        data: null
      };
    }
  }

  async createLinkAja(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/link-aja", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });

      return execution.data;
    } catch (error: any) {
      console.log("LINKAJA ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create LinkAja",
        data: null
      };
    }
  }

  async createAlfamart(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/alfamart", {
      title: data.title,
      amount: data.amount,
      name: data.name,
      email: data.email,
      ...(data?.refId ? { refId: data.refId } : {}),
      ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
      ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
      ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
      ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
      ...(data?.items ? { items: data.items } : {})
    });

    return execution.data;
  }

  async createVA(data: FlipMinimumRequest & { bank: string; }): Promise<FlipGeneralCreatedResponse> {
    try {
      const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/va", {
        title: data.title,
        amount: data.amount,
        name: data.name,
        email: data.email,
        bank: data.bank,
        ...(data?.refId ? { refId: data.refId } : {}),
        ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
        ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
        ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
        ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
        ...(data?.items ? { items: data.items } : {})
      });

      return execution.data;
    } catch (error: any) {
      console.log("VA ====>", error);
      return {
        success: false,
        message: error?.message || "Failed to create VA",
        data: null
      };
    }
  }

  async createCreditCard(data: FlipMinimumRequest): Promise<FlipGeneralCreatedResponse> {
    const execution = await flipInstance.post<FlipGeneralCreatedResponse>("v1/flip/create/credit-card", {
      title: data.title,
      amount: data.amount,
      name: data.name,
      email: data.email,
      ...(data?.refId ? { refId: data.refId } : {}),
      ...(data?.isPhoneNumberRequired ? { isPhoneNumberRequired: data.isPhoneNumberRequired } : {}),
      ...(data?.isAddressRequired ? { isAddressRequired: data.isAddressRequired } : {}),
      ...(data?.redirectUrl ? { redirectUrl: data.redirectUrl } : {}),
      ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
      ...(data?.items ? { items: data.items } : {})
    });

    return execution.data;
  }
}

export default new FlipService();
