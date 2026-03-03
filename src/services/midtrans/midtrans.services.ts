import {
    MidtransMinimumVARequest,
    MidtransVACreatedResponse
} from "../../dataTypes/midtrans";
import integrationInstance from "@config/integration";

const midtransInstance = integrationInstance();

export class MidtransService {
    async createVA(data: MidtransMinimumVARequest): Promise<MidtransVACreatedResponse> {
        try {
            const execution = await midtransInstance.post<MidtransVACreatedResponse>("v1/midtrans/create/va", {
                amount: data.amount,
                name: data.name,
                email: data.email,
                bank: data.bank,
                refId: data.refId,
                custom_expiry: {
                    expiry_duration: 1440,
                    unit: "minute"
                },
                ...(data?.itemDetails ? { itemDetails: data.itemDetails } : {}),
                ...(data?.expiredDate ? { expiredDate: data.expiredDate } : {}),
                ...(data?.freeText ? { freeText: data.freeText } : {}),
                ...(data?.customField1 ? { customField1: data.customField1 } : {}),
                ...(data?.customField2 ? { customField2: data.customField2 } : {}),
                ...(data?.customField3 ? { customField3: data.customField3 } : {})
            });

            return execution.data;
        } catch (error: any) {
            console.log("MIDTRANS VA ====>", error);
            return {
                success: false,
                message: error?.message || "Failed to create Midtrans VA",
                data: null
            };
        }
    }
}

export default new MidtransService();
