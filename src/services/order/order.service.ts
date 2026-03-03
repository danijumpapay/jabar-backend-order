import { transaction, service, user, customer, common, company } from "@jumpapay/jumpapay-models";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@config/logger";
import {
    CreateOrderRequest,
    RefundRequest,
    OrderStatusStep,
} from "@dataTypes/order";
import {
    generateId,
    initialName,
    extractPlate,
    useFormula,
    parseIDNumber,
    calculateDueDateInMonths,
    calculateDueDateInDays,
    convertMonthToYM,
    getVehicleTypeId,
    getVehicleType
} from "@utils/helpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) {
        formatted = "62" + formatted.slice(1);
    } else if (!formatted.startsWith("62")) {
        formatted = "62" + formatted;
    }
    return formatted;
};

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const ORDER_STATUS_STEPS: Record<number, OrderStatusStep[]> = {
    // Standard Steps in Indonesian for UI
    7: [ // Waiting for Payment
        { title: "Order Dibuat", completed: true },
        { title: "Pembayaran Terverifikasi", completed: false },
        { title: "Proses Dokumen", completed: false },
        { title: "Pengiriman Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    1: [ // Verifikasi Order
        { title: "Order Dibuat", completed: true },
        { title: "Pembayaran Terverifikasi", completed: true },
        { title: "Proses Dokumen", completed: false },
        { title: "Pengiriman Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    4: [ // Pengurusan di Samsat
        { title: "Order Dibuat", completed: true },
        { title: "Pembayaran Terverifikasi", completed: true },
        { title: "Proses Dokumen", completed: true },
        { title: "Pengiriman Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    5: [ // Pengembalian Dokumen
        { title: "Order Dibuat", completed: true },
        { title: "Pembayaran Terverifikasi", completed: true },
        { title: "Proses Dokumen", completed: true },
        { title: "Pengiriman Dokumen", completed: true },
        { title: "Selesai", completed: false },
    ],
    6: [ // Selesai
        { title: "Order Dibuat", completed: true },
        { title: "Pembayaran Terverifikasi", completed: true },
        { title: "Proses Dokumen", completed: true },
        { title: "Pengiriman Dokumen", completed: true },
        { title: "Selesai", completed: true },
    ],
    8: [ // Cancel
        { title: "Order Dibatalkan", completed: true },
    ],
};

const STATUS_MAP_ID: Record<number, string> = {
    7: "Menunggu Pembayaran",
    1: "Pembayaran Terverifikasi",
    4: "Dalam Proses Samsat",
    5: "Pengembalian Dokumen",
    6: "Selesai",
    8: "Dibatalkan",
};

// ─── Order Service ────────────────────────────────────────────────────────────

const orderService = {
    /**
     * Create a new order.
     */
    async createOrder(data: CreateOrderRequest, companyId: string) {
        const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber);

        try {
            // 1. Fetch Basic Info
            const [selectedSvc, serviceAliasRow, serviceFees, orderCountRow] = await Promise.all([
                service.Services.query().where("id", Number(data.serviceId)).first() as any,
                service.MvServices.query().where("id", Number(data.serviceId)).select("alias").first() as any,
                company.VCompanyFeeServices.query()
                    .where("service_id", Number(data.serviceId))
                    .andWhere("company_id", companyId) as any,
                service.VServiceOrderCounts.query().where("id", Number(data.serviceId)).first() as any
            ]);

            const serviceName = selectedSvc?.name || "Layanan Pajak";
            const alias = serviceAliasRow?.alias || initialName(serviceName) || "KP";

            // 2. Manage User & Identity
            let userId = "";
            const existingUser = await user.Users.query().where("phone", formattedPhoneNumber).first() as any;
            if (existingUser) {
                userId = existingUser.id;
            } else {
                userId = generateId(data.name);
                await user.Users.query().insert({
                    id: userId,
                    name: data.name,
                    phone: formattedPhoneNumber,
                    role: "CUSTOMER",
                    is_active: true,
                } as any);
            }

            // 3. ID Generation (Align with Bot)
            const orderId = generateId(serviceName);
            const orderDetailId = `${orderId}-${generateId(data.name)}`;
            const nextVal = orderCountRow?.nextval || 1;
            const bookingId = `${alias}${String(nextVal).padStart(5, '0')}`;

            // 4. Formula Calculation
            const taxData = data.taxData || {
                PKB_POKOK: "0", PKB_DENDA: "0", SWD_POKOK: "0", SWD_DENDA: "0",
                ADM_STNK: "0", ADM_TNKB: "0", OPSEN_POKOK: "0", OPSEN_DENDA: "0",
                JUMLAH_BAYAR: "0", TGL_AKHIR_PAJAK: "", TGL_AKHIR_STNKB: ""
            };

            const swdPokokValue = parseIDNumber(taxData.SWD_POKOK);
            const vehicleTypeId = getVehicleTypeId(swdPokokValue);
            const vehicleTypeName = getVehicleType(swdPokokValue);

            const monthsDueDate = calculateDueDateInMonths(taxData.TGL_AKHIR_PAJAK);
            const daysDueDate = calculateDueDateInDays(taxData.TGL_AKHIR_PAJAK);
            const YMDueDate = convertMonthToYM(monthsDueDate);

            const formulaVariables: any = {
                VEHICLE_TYPE_ID: vehicleTypeId,
                SWDKLLJ: swdPokokValue,
                SWDKLLJ_DENDA: parseIDNumber(taxData.SWD_DENDA),
                PKB: parseIDNumber(taxData.PKB_POKOK),
                PKB_DENDA: parseIDNumber(taxData.PKB_DENDA),
                OPSEN_PKB: parseIDNumber(taxData.OPSEN_POKOK),
                OPSEN_PKB_DENDA: parseIDNumber(taxData.OPSEN_DENDA),
                TAHUN_TERLAMBAT: YMDueDate.year,
                BULAN_TERLAMBAT: monthsDueDate,
                HARI_TERLAMBAT: daysDueDate + 30
            };

            const serviceFeesForm = serviceFees.length > 0
                ? serviceFees.map((sf: any) => {
                    let calculatedValue = 0;
                    if (sf.type === "FORMULA" && sf.formula) {
                        try {
                            calculatedValue = useFormula(formulaVariables, sf.formula)();
                        } catch (error) {
                            console.error(`Error processing formula for '${sf.name}':`, sf.formula, error);
                        }
                    } else {
                        calculatedValue = sf.value || 0;
                    }

                    return {
                        order_detail_id: orderDetailId,
                        fee_name: sf.name,
                        order_fee_name: sf.order_fee_name,
                        order_fee_group: sf.order_fee_group,
                        fee_group_name: sf.fee_group_name,
                        zero_placeholder: sf.zero_placeholder,
                        value: Number(calculatedValue)
                    };
                })
                : [];

            // 5. Insert Vehicle
            const plateParts = extractPlate(data.plateNumber);
            const plateRow = await common.Plates.query().where("name", plateParts?.prefix || "D").first() as any;
            const vehicleId = generateId(vehicleTypeName);

            await customer.Vehicles.query().insert({
                id: vehicleId,
                user_id: userId,
                plate_id: plateRow?.id || 2,
                plate_number: plateParts?.number || data.plateNumber,
                plate_serial: plateParts?.serial || "",
                chassis_number: data.chassisNumber,
                vehicle_type_id: Number(data.vehicleType) || vehicleTypeId,
            } as any).catch(e => logger.warn({ error: e.message }, "Failed to insert vehicle"));

            // 6. Insert Order & Detail
            // Find City ID matching data.city name, fallback to Kota Bandung (ID: 30)
            let cityMatch = null;
            if (data.city) {
                cityMatch = await common.Cities.query()
                    .whereRaw("LOWER(name) LIKE ?", [`%${data.city.toLowerCase()}%`])
                    .first() as any;
            }

            if (!cityMatch && data.address) {
                const knownCities = ["Bandung", "Jakarta", "Bekasi", "Depok", "Bogor", "Cirebon", "Sukabumi", "Garut", "Tasikmalaya"];
                for (const cityName of knownCities) {
                    if (data.address.toLowerCase().includes(cityName.toLowerCase())) {
                        cityMatch = await common.Cities.query()
                            .whereRaw("LOWER(name) LIKE ?", [`%${cityName.toLowerCase()}%`])
                            .first() as any;
                        if (cityMatch) break;
                    }
                }
            }
            const finalCityId = cityMatch?.id || 30;

            await transaction.Orders.query().insert({
                id: orderId,
                user_id: userId,
                company_id: companyId,
                order_status_id: 7,
                booking_id: bookingId,
                phone: formattedPhoneNumber,
                source: "WEB - Akang Pajak",
                price: Number(data.totalAmount),
                email: data.email,
                order_category: "B2C",
                city_id: finalCityId
            } as any);

            await transaction.OrderDetails.query().insert({
                id: orderDetailId,
                order_id: orderId,
                service_id: Number(data.serviceId),
                vehicle_id: vehicleId,
                name: data.name,
                price: Number(data.totalAmount),
                plate_prefix: plateParts?.prefix || "",
                plate_number: plateParts?.number || data.plateNumber,
                plate_serial: plateParts?.serial || "",
            } as any);

            // 7. Insert Fees
            if (serviceFeesForm.length > 0) {
                await transaction.OrderDetailFees.query().insert(serviceFeesForm);
            }

            // 8. Order Form Datas
            await transaction.OrderFormDatas.query().insert({
                id: uuidv4(),
                order_detail_id: orderDetailId,
                form_token: "WEB_ORDER",
                form_data: {
                    customer: {
                        name: data.name,
                        email: data.email,
                        phoneNumber: formattedPhoneNumber,
                        identityNumber: data.identityNumber,
                    },
                    vehicle: {
                        plateNumber: data.plateNumber,
                        chassisNumber: data.chassisNumber,
                        vehicleType: data.vehicleType,
                        ...taxData
                    },
                    logistics: {
                        address: data.address,
                        city: data.city,
                        addressNote: data.addressNote,
                        deliveryFee: data.deliveryFee,
                    },
                    payment: {
                        method: data.paymentMethod,
                        totalAmount: data.totalAmount,
                        voucherCode: data.voucherCode,
                        promoId: data.promoId,
                    }
                },
            } as any);

            // 9. Insert addresses
            if (data.address) {
                const addressId = generateId(data.name);

                await customer.Addresses.query().insert({
                    id: addressId,
                    user_id: userId,
                    city_id: finalCityId,
                    name: "Alamat Order Web",
                    address_type: "HOUSE",
                    raw_address: data.address,
                    landmark: data.addressNote || "",
                    latitude: data.latitude,
                    longitude: data.longitude,
                    is_pickup_address: true,
                    is_return_address: true
                } as any);

                await Promise.all([
                    transaction.OrderAddresses.query().insert({
                        id: uuidv4(),
                        order_id: orderId,
                        address_id: addressId,
                        user_id: userId,
                        city_name: data.city || "",
                        raw_address: data.address,
                        landmark: data.addressNote || "",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        delivery_type: "PICKUP",
                        status: "WAITING FOR DRIVER"
                    } as any),
                    transaction.OrderAddresses.query().insert({
                        id: uuidv4(),
                        order_id: orderId,
                        address_id: addressId,
                        user_id: userId,
                        city_name: data.city || "",
                        raw_address: data.address,
                        landmark: data.addressNote || "",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        delivery_type: "RETURN",
                        status: "WAITING FOR DRIVER"
                    } as any)
                ]);
            }

            logger.info({ orderId, bookingId }, "Order created successfully aligned with Bot");

            return {
                orderId,
                bookingId,
            };
        } catch (error) {
            console.error("DB INSERT ERROR:", error);
            throw error;
        }
    },

    async getOrderByBookingId(bookingId: string) {
        return await transaction.Orders.query()
            .select(
                "orders.id as orderId",
                "orders.booking_id as bookingId",
                "orders.order_status_id as orderStatusId",
                "orders.price",
                "orders.paid_at as paidAt",
                "orders.email",
                "orders.created_at as createdAt",
                "os.name as orderStatus",
                "order_details.name as customerName",
                "order_details.service_id as serviceId",
            )
            .leftJoin("common.order_status as os", "os.id", "orders.order_status_id")
            .leftJoin("transaction.order_details", "order_details.order_id", "orders.id")
            .whereRaw("LOWER(orders.booking_id) = ?", [bookingId.toLowerCase()])
            .first() as any;
    },

    async getOrderById(orderId: string) {
        return await transaction.Orders.query()
            .select(
                "orders.id as orderId",
                "orders.booking_id as bookingId",
                "orders.order_status_id as orderStatusId",
                "orders.price",
                "orders.paid_at as paidAt",
                "orders.email",
                "orders.created_at as createdAt",
                "os.name as orderStatus",
                "order_details.name as customerName",
                "order_details.service_id as serviceId",
            )
            .leftJoin("common.order_status as os", "os.id", "orders.order_status_id")
            .leftJoin("transaction.order_details", "order_details.order_id", "orders.id")
            .whereRaw("LOWER(orders.id) = ?", [orderId.toLowerCase()])
            .first() as any;
    },

    async getServiceName(serviceId: string): Promise<string> {
        try {
            const svc = await service.Services?.query().where("id", Number(serviceId)).first() as any;
            return svc?.name || "Layanan Pajak";
        } catch {
            return "Layanan Pajak";
        }
    },

    buildStatusSteps(orderStatusId: number): OrderStatusStep[] {
        return ORDER_STATUS_STEPS[orderStatusId] || ORDER_STATUS_STEPS[7];
    },

    async getOrderDetail(bookingId: string) {
        const order = await this.getOrderByBookingId(bookingId);
        if (!order) return null;

        const serviceName = await this.getServiceName(order.serviceId);
        const statusTitle = STATUS_MAP_ID[order.orderStatusId] || order.orderStatus || "Menunggu Pembayaran";

        return {
            orderId: order.orderId,
            bookingId: order.bookingId,
            status: statusTitle,
            orderStatusId: order.orderStatusId,
            name: order.customerName || "-",
            email: order.email || "-",
            serviceName: serviceName,
            totalAmount: formatCurrency(Number(order.price)),
            orderDate: formatDate(order.createdAt),
            steps: this.buildStatusSteps(order.orderStatusId),
        };
    },

    async getPaymentStatus(orderId: string) {
        const order = await this.getOrderById(orderId);
        if (!order) return null;

        const isPaid = !!order.paidAt;
        const isCancelled = order.orderStatusId === 8;

        let status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" = "PENDING";
        if (isPaid) status = "PAID";
        else if (isCancelled) status = "CANCELLED";

        return {
            paid: isPaid,
            status,
            paidAt: order.paidAt || null,
        };
    },

    async cancelOrder(orderId: string) {
        const order = await this.getOrderById(orderId);
        if (!order) return null;

        if (order.paidAt) {
            throw new Error("Order already paid and cannot be cancelled");
        }

        await transaction.Orders.query()
            .patch({ order_status_id: 8 } as any)
            .where("id", orderId);

        logger.info({ orderId }, "Order cancelled");
        return true;
    },

    async createRefund(orderId: string, data: RefundRequest) {
        await transaction.Orders.query()
            .patch({ order_status_id: 5 } as any)
            .where("id", orderId);

        logger.info({ orderId, bank: data.bank }, "Refund request submitted");
        return { refundId: generateId("refund"), estimatedTimeline: "7-14 Hari Kerja" };
    },
};

export default orderService;
