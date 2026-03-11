import { transaction, service, user, customer, common } from "@jumpapay/jumpapay-models";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@config/logger";
import { transaction as ObjectionTransaction } from "objection";
import db from "@config/connection";
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
    getVehicleType,
    extractYMD_HI,
    hardcodedTestingNumbers
} from "@utils/helpers";
import flipServices from "@services/flip/flip.services";
import midtransServices from "@services/midtrans/midtrans.services";
import { emailService } from "@services/email/email.service";

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

const KANGPAJAK_FLOW: number[] = [7, 3, 4, 5, 12, 6];
const KANGPAJAK_CANCEL_STATUS = 8;
const KANGPAJAK_STATUS_NAMES: Record<number, string> = {
    7: "Menunggu Pembayaran",
    3: "Proses",
    4: "Pengurusan di Samsat",
    5: "Pengataran Dokumen",
    12: "Dokumen diterima",
    6: "Selesai"
};

let orderStatusCache: Record<number, string> | null = null;

const getOrderStatusMap = async (): Promise<Record<number, string>> => {
    if (orderStatusCache) return orderStatusCache;
    try {
        const rows = await db("common.order_status").select("id", "name");
        orderStatusCache = rows.reduce((acc: Record<number, string>, row: any) => {
            acc[row.id] = row.name;
            return acc;
        }, {});
    } catch {
        orderStatusCache = {};
    }
    return orderStatusCache;
};

const buildStepsFromDB = async (currentStatusId: number): Promise<OrderStatusStep[]> => {
    const statusMap = await getOrderStatusMap();

    if (currentStatusId === KANGPAJAK_CANCEL_STATUS) {
        return [{ title: statusMap[KANGPAJAK_CANCEL_STATUS] || "Dibatalkan", completed: true }];
    }

    const resolvedId = (currentStatusId === 11 || currentStatusId === 1) ? 3 : currentStatusId;
    const currentIndex = KANGPAJAK_FLOW.indexOf(resolvedId);
    const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

    return KANGPAJAK_FLOW.map((statusId, index) => ({
        title: KANGPAJAK_STATUS_NAMES[statusId] || statusMap[statusId] || `Status ${statusId}`,
        completed: index <= effectiveIndex,
    }));
};

const orderService = {

    async createOrder(data: CreateOrderRequest, companyId: string) {
        const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber);

        return await ObjectionTransaction(db, async (trx) => {

            const [selectedSvc, serviceAliasRow, serviceFees, orderCountRow] = await Promise.all([
                service.Services.query(trx).where("id", Number(data.serviceId)).first() as any,
                service.MvServices.query(trx).where("id", Number(data.serviceId)).select("alias").first() as any,
                common.VJumpapayFeeServices.query(trx)
                    .where("service_id", Number(data.serviceId)) as any,
                service.VServiceOrderCounts.query(trx).where("id", Number(data.serviceId)).first() as any
            ]);

            const serviceName = selectedSvc?.name || "Layanan Pajak";
            const alias = serviceAliasRow?.alias || initialName(serviceName) || "KP";


            let userId = "";
            const existingUser = await user.Users.query(trx).where("phone", formattedPhoneNumber).first() as any;
            if (existingUser) {
                userId = existingUser.id;
            } else {
                userId = generateId(data.name);
                await user.Users.query(trx).insert({
                    id: userId,
                    name: data.name,
                    phone: formattedPhoneNumber,
                    role: "CUSTOMER",
                    is_active: true,
                } as any);
            }


            const orderId = generateId(serviceName);
            const orderDetailId = `${orderId}-${generateId(data.name)}`;
            const nextVal = orderCountRow?.nextval || 1;
            const bookingId = `${alias}${String(nextVal).padStart(5, '0')}`;


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


            const taxFees = [
                { name: "PKB Pokok", group: 1, groupName: "Biaya Pajak", order: 1, value: parseIDNumber(taxData.PKB_POKOK) },
                { name: "PKB Denda", group: 1, groupName: "Biaya Pajak", order: 2, value: parseIDNumber(taxData.PKB_DENDA) },
                { name: "SWDKLLJ Pokok", group: 1, groupName: "Biaya Pajak", order: 3, value: parseIDNumber(taxData.SWD_POKOK) },
                { name: "SWDKLLJ Denda", group: 1, groupName: "Biaya Pajak", order: 4, value: parseIDNumber(taxData.SWD_DENDA) },
                { name: "PNB STNK", group: 1, groupName: "Biaya Pajak", order: 5, value: parseIDNumber(taxData.ADM_STNK) },
                { name: "PNB TNKB", group: 1, groupName: "Biaya Pajak", order: 6, value: parseIDNumber(taxData.ADM_TNKB) },
                { name: "OPSEN PKB Pokok", group: 1, groupName: "Biaya Pajak", order: 7, value: parseIDNumber(taxData.OPSEN_POKOK) },
                { name: "OPSEN PKB Denda", group: 1, groupName: "Biaya Pajak", order: 8, value: parseIDNumber(taxData.OPSEN_DENDA) },
                { name: "Pajak Tertunggak (SKP)", group: 1, groupName: "Biaya Pajak", order: 9, value: 0 },
            ];

            const manualFeeEntries = taxFees.map(tf => ({
                order_detail_id: orderDetailId,
                fee_name: tf.name,
                order_fee_name: tf.order,
                order_fee_group: tf.group,
                fee_group_name: tf.groupName,
                zero_placeholder: null,
                value: tf.value
            }));

            const serviceFeesFormRaw = [];

            if (data.deliveryFee > 0) {
                serviceFeesFormRaw.push({
                    order_detail_id: orderDetailId,
                    fee_name: "Ongkir",
                    order_fee_name: 99,
                    order_fee_group: 2,
                    fee_group_name: "Biaya Jasa JumpaPay",
                    zero_placeholder: null,
                    value: Number(data.deliveryFee)
                });
            }

            serviceFeesFormRaw.push({
                order_detail_id: orderDetailId,
                fee_name: "Biaya Admin",
                order_fee_name: 98,
                order_fee_group: 2,
                fee_group_name: "Biaya Jasa JumpaPay",
                zero_placeholder: null,
                value: 10000
            });

            const serviceFeesForm = [...manualFeeEntries, ...serviceFeesFormRaw];

            const plateParts = extractPlate(data.plateNumber);
            const plateRow = await common.Plates.query(trx).where("name", plateParts?.prefix || "D").first() as any;
            const plateId = plateRow?.id || 2;
            const plateNumber = plateParts?.number || data.plateNumber;
            const plateSerial = plateParts?.serial || "";

            let vehicleId = "";
            const existingVehicle = await customer.Vehicles.query(trx).where({
                user_id: userId,
                plate_id: plateId,
                plate_number: plateNumber,
                plate_serial: plateSerial
            }).first() as any;

            if (existingVehicle) {
                vehicleId = existingVehicle.id;
            } else {
                vehicleId = generateId(vehicleTypeName ?? "Vehicle");
                await customer.Vehicles.query(trx).insert({
                    id: vehicleId,
                    user_id: userId,
                    plate_id: plateId,
                    plate_number: plateNumber,
                    plate_serial: plateSerial,
                    chassis_number: data.chassisNumber,
                    vehicle_type_id: vehicleTypeId,
                } as any);
            }


            let cityMatch = null;
            if (data.city) {
                cityMatch = await common.Cities.query(trx)
                    .whereRaw("LOWER(name) LIKE ?", [`%${data.city.toLowerCase()}%`])
                    .first() as any;
            }

            if (!cityMatch && data.address) {
                const knownCities = ["Bandung", "Jakarta", "Bekasi", "Depok", "Bogor", "Cirebon", "Sukabumi", "Garut", "Tasikmalaya"];
                for (const cityName of knownCities) {
                    if (data.address.toLowerCase().includes(cityName.toLowerCase())) {
                        cityMatch = await common.Cities.query(trx)
                            .whereRaw("LOWER(name) LIKE ?", [`%${cityName.toLowerCase()}%`])
                            .first() as any;
                        if (cityMatch) break;
                    }
                }
            }
            const finalCityId = cityMatch?.id || 30;

            await transaction.Orders.query(trx).insert({
                id: orderId,
                user_id: userId,
                company_id: companyId,
                order_status_id: 7,
                booking_id: bookingId,
                phone: formattedPhoneNumber,
                source: "WEB - JABAR",
                price: Number(data.totalAmount),
                email: data.email,
                order_category: "B2C",
                city_id: finalCityId
            } as any);

            await transaction.OrderDetails.query(trx).insert({
                id: orderDetailId,
                order_id: orderId,
                service_id: Number(data.serviceId),
                vehicle_id: vehicleId,
                name: data.name,
                price: Number(data.totalAmount),
                plate_prefix: plateParts?.prefix || "",
                plate_number: plateParts?.number || data.plateNumber,
                plate_serial: plateParts?.serial || "",
                is_stnk_equals_ktp: true

            } as any);


            if (serviceFeesForm.length > 0) {
                await transaction.OrderDetailFees.query(trx).insert(serviceFeesForm);
            }


            const formTokenMap: Record<string, string> = {
                "baln": "BALIK_NAMA",
                "blp": "BLOKIR_PLAT",
                "mcb": "MUTASI_CABUT_BERKAS",
                "mlk": "MUTASI_LENGKAP",
                "us5t": "PERPANJANG_PAJAK_5_TAHUNAN",
                "ust": "PERPANJANG_PAJAK_TAHUNAN"
            };
            const formToken = formTokenMap[alias.toLowerCase()] || "WEB_ORDER";

            let samsatAddress = data.address || `${data.city}, Jawa Barat`;
            let addressName = "Alamat Order Web";
            let isPickup = true;
            let isReturn = true;

            if (data.isSamsatPickup) {
                samsatAddress = data.taxData?.WILAYAH_SAMSAT || samsatAddress;
                addressName = "Pengambilan di Samsat";
                isPickup = false;
                isReturn = false;
            }

            await transaction.OrderFormDatas.query(trx).insert({
                id: uuidv4(),
                order_detail_id: orderDetailId,
                form_token: formToken,
                form_data: {
                    booking_id: bookingId,
                    full_name: data.name,
                    flow_token: formToken,
                    pkb_tertagih: String(parseIDNumber(taxData.PKB_POKOK) + parseIDNumber(taxData.PKB_DENDA)),
                    jenis_kendaraan: vehicleTypeName,
                    is_stnk_equals_ktp: "1",
                    masa_berlaku_pajak: taxData.TGL_AKHIR_PAJAK || "",
                    nomor_plat_kendaraan: `${plateParts?.prefix || ""} ${plateParts?.number || ""} ${plateParts?.serial || ""}`.trim()
                },
            } as any);


            if (data.address || data.isSamsatPickup) {
                const addressId = generateId(data.name);

                await customer.Addresses.query(trx).insert({
                    id: addressId,
                    user_id: userId,
                    city_id: finalCityId,
                    name: addressName,
                    address_type: "HOUSE",
                    raw_address: samsatAddress,
                    landmark: data.addressNote || "",
                    latitude: data.latitude,
                    longitude: data.longitude,
                    is_pickup_address: isPickup,
                    is_return_address: isReturn
                } as any);

                await Promise.all([
                    transaction.OrderAddresses.query(trx).insert({
                        id: uuidv4(),
                        order_id: orderId,
                        address_id: addressId,
                        user_id: userId,
                        city_name: data.city || "",
                        raw_address: samsatAddress,
                        landmark: data.addressNote || "",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        delivery_type: "PICKUP",
                        status: "WAITING FOR DRIVER",
                    } as any),
                    transaction.OrderAddresses.query(trx).insert({
                        id: uuidv4(),
                        order_id: orderId,
                        address_id: addressId,
                        user_id: userId,
                        city_name: data.city || "",
                        raw_address: samsatAddress,
                        landmark: data.addressNote || "",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        delivery_type: "RETURN",
                        status: "WAITING FOR DRIVER",
                    } as any)
                ]);
            }


            const paymentMethodName = data.paymentMethod || "BCA";
            const paymentMethodType = "DIGITAL_WALLET";
            const totalRecalculated = data.totalAmount;
            const finalPrice = Number(totalRecalculated);
            const EWalletTax = 0;

            await Promise.all([
                transaction.Orders.query(trx).patch({ price: finalPrice } as any).where("id", orderId),
                transaction.OrderDetails.query(trx).patch({ price: finalPrice } as any).where("id", orderDetailId)
            ]);

            const paymentUniqCode = `${orderId}-${Date.now().toString().slice(-6)}`;
            let flipAmount = finalPrice;

            if (hardcodedTestingNumbers.includes(formattedPhoneNumber)) {
                flipAmount = 1000;
            }

            const dateObj = new Date();
            dateObj.setHours(dateObj.getHours() + 24);
            const expiredAtStr = dateObj.toISOString();
            let generatePayment: any = { success: false, message: "Metode pembayaran tidak didukung" };

            const flipPayload = {
                title: serviceName,
                name: data.name,
                email: data.email,
                amount: flipAmount,
                refId: paymentUniqCode,
                expiredDate: extractYMD_HI(expiredAtStr),
            };

            const midtransPayload = {
                amount: flipAmount,
                refId: paymentUniqCode,
                email: data.email,
                name: data.name,
                bank: "",
                expiredDate: expiredAtStr
            };

            const methodUpper = paymentMethodName.toUpperCase();


            const bankVA = ["BJB", "MANDIRI", "BCA", "BNI", "BRI", "PERMATA", "CIMB"];

            if (methodUpper === "QRIS") {
                generatePayment = await flipServices.createQRIS(flipPayload);
            } else if (methodUpper === "SHOPEEPAY") {
                generatePayment = await flipServices.createShopeePay(flipPayload);
            } else if (methodUpper === "DANA") {
                generatePayment = await flipServices.createDana(flipPayload);
            } else if (methodUpper === "OVO") {
                generatePayment = await flipServices.createOvo(flipPayload);
            } else if (methodUpper === "LINKAJA") {
                generatePayment = await flipServices.createLinkAja(flipPayload);
            } else if (bankVA.includes(methodUpper)) {

                generatePayment = await midtransServices.createVA({
                    ...midtransPayload,
                    bank: methodUpper.toLowerCase()
                });
            } else {

                generatePayment = await flipServices.createQRIS(flipPayload);
            }

            if (!generatePayment.success) {
                throw new Error(`Gagal membuat tagihan ${paymentMethodName}: ${generatePayment.message || 'Payment service error'}`);
            }


            const paymentDetails = generatePayment.data?.bill_payment || generatePayment.data;
            const paymentStatus = "PENDING";

            await transaction.Payments.query(trx).insert({
                id: paymentUniqCode,
                company_id: companyId,
                invoice_number: bookingId,
                payment_method_name: paymentMethodName,
                payment_method_type: paymentMethodType,
                amount: finalPrice,
                expired_at: expiredAtStr,
                payment_details: paymentDetails,
                status: paymentStatus
            } as any);


            await transaction.OrderDetailFees.query(trx).insert({
                order_detail_id: orderDetailId,
                order_fee_name: 100,
                order_fee_group: 100,
                fee_name: "Pajak Metode Pembayaran",
                fee_group_name: "Lainnya",
                value: EWalletTax
            } as any);


            await transaction.Orders.query(trx).patch({
                price: finalPrice
            } as any).where("id", orderId);

            await transaction.PaymentItems.query(trx).insert({
                payment_id: paymentUniqCode,
                order_id: orderId
            } as any);

            logger.info({ orderId, bookingId, paymentDetails }, "Order created successfully aligned with Bot and Atomized");

            this.getOrderDetail(bookingId).then((orderDetail) => {
                if (orderDetail && orderDetail.email) {
                    let paymentLink = `https://order.kangpajak.com/tracking?id=${bookingId}`;
                    if (paymentDetails?.link_url) {
                        paymentLink = paymentDetails.link_url;
                    } 
                    
                    emailService.sendOrderCreated(orderDetail.email, orderDetail.name, orderDetail, paymentLink)
                        .catch(err => logger.error({ err, orderId }, "Error sending order created email"));
                }
            }).catch(err => logger.error({ err, orderId }, "Error fetching order detail for notification"));

            return {
                orderId,
                bookingId,
                paymentDetails: paymentDetails,
                finalTotal: finalPrice
            };
        });
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
                "orders.phone as phoneNumber",
                "order_details.plate_number as plateNumber",
                "order_details.id as orderDetailId",
                "order_details.service_id as serviceId",
                "payments.payment_details as paymentDetails",
                "payments.payment_method_name as paymentMethodName"
            )
            .leftJoin("common.order_status as os", "os.id", "orders.order_status_id")
            .leftJoin("transaction.order_details", "order_details.order_id", "orders.id")
            .leftJoin("transaction.payment_items", "payment_items.order_id", "orders.id")
            .leftJoin("transaction.payments", "payments.id", "payment_items.payment_id")
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
                "orders.phone as phoneNumber",
                "order_details.plate_number as plateNumber",
                "order_details.id as orderDetailId",
                "order_details.service_id as serviceId",
                "payments.payment_details as paymentDetails",
                "payments.payment_method_name as paymentMethodName"
            )
            .leftJoin("common.order_status as os", "os.id", "orders.order_status_id")
            .leftJoin("transaction.order_details", "order_details.order_id", "orders.id")
            .leftJoin("transaction.payment_items", "payment_items.order_id", "orders.id")
            .leftJoin("transaction.payments", "payments.id", "payment_items.payment_id")
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

    async buildStatusSteps(orderStatusId: number): Promise<OrderStatusStep[]> {
        return buildStepsFromDB(orderStatusId);
    },

    async getOrderDetail(bookingId: string) {
        const order = await this.getOrderByBookingId(bookingId);
        if (!order) return null;

        const correctDetail = await (transaction.OrderDetails as any).query()
            .where("order_id", order.orderId)
            .first();
        if (correctDetail) {
            order.orderDetailId = correctDetail.id;
        }

        const serviceName = await this.getServiceName(order.serviceId);

        let currentStatusId = order.orderStatusId;
        const createdAtDate = new Date(order.createdAt);
        const now = new Date();
        const diffHours = (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);

        if (currentStatusId === 7 && diffHours > 24) {
            currentStatusId = 8;
        }

        if (currentStatusId === 11 || currentStatusId === 1) {
            currentStatusId = 3;
        }

        const statusMap = await getOrderStatusMap();
        let statusTitle = KANGPAJAK_STATUS_NAMES[currentStatusId] || statusMap[currentStatusId] || order.orderStatus || "Menunggu Pembayaran";
        let cancelReason = "";

        if (currentStatusId === 8) {
            statusTitle = "Dibatalkan";
            cancelReason = "Pesanan dibatalkan otomatis karena pembayaran tidak diterima dalam batas waktu yang ditentukan. Silakan buat pesanan baru jika ingin melanjutkan.";
        }

        const orderId = order.orderId;

        const [orderDetailFees, formDataRecord, docs, orderAddress] = await Promise.all([
            transaction.OrderDetailFees.query()
                .where("order_detail_id", order.orderDetailId)
                .orderBy("order_fee_group", "asc")
                .orderBy("order_fee_name", "asc"),
            transaction.OrderFormDatas.query()
                .where("order_detail_id", order.orderDetailId)
                .first(),
            transaction.OrderDetailDocuments.query()
                .where("order_detail_id", order.orderDetailId),
            transaction.OrderAddresses.query()
                .where("order_id", orderId)
                .first()
        ]) as [any[], any, any[], any];

        let vehicleType = "-";
        try {
            if (formDataRecord || (orderDetailFees && orderDetailFees.length > 0)) {
                const fd = formDataRecord?.form_data || {};
                const swdFee = orderDetailFees.find(f => f.fee_name === "SWDKLLJ Pokok" || f.fee_name === "SWDKLLJ");
                const swdFromFees = swdFee ? parseIDNumber(swdFee.value) : 0;
                const derivedFromFees = getVehicleType(swdFromFees);
                const swdFromForm = parseIDNumber(fd.swd_pokok || fd.swdPokok);
                const derivedFromForm = getVehicleType(swdFromForm);

                vehicleType = derivedFromFees || fd.jenis_kendaraan || fd.jenisKendaraan || fd.vehicleType || 
                            derivedFromForm || fd.service_name || "-";
            }
        } catch (err) {
            logger.error({ err, orderId: order.orderId }, "Error determining vehicle type");
        }

        const fd = formDataRecord?.form_data || {};
        const pkbTerakhir = fd.pkb_tertagih || fd.pkbTertagih || fd.pkb_pokok || fd.pkbPokok || "0";
        const masaBerlakuPajak = fd.masa_berlaku_pajak || fd.masaBerlakuPajak || "-";
        let payments = await transaction.Payments.query()
            .join("transaction.payment_items", "payments.id", "transaction.payment_items.payment_id")
            .where("transaction.payment_items.order_id", orderId)
            .select("payments.*") as any[];
        
        if (order.paidAt && payments.length === 0) {
            let method = order.paymentMethodName && order.paymentMethodName !== "-" ? order.paymentMethodName : "Simulasi Pembayaran";
            if (method !== "Simulasi Pembayaran") method = `${method} - Simulasi`;

            payments = [{
                id: "simulated-" + orderId,
                payment_method_name: method,
                payment_method_type: "MANUAL",
                status: "PAID",
                paid_at: order.paidAt,
                amount: order.price,
                payment_details: { type: "SIMULATED" }
            }];
        }
        
        let paymentMethodName = order.paymentMethodName || "-";
        if (payments.length > 0) {
            paymentMethodName = payments[0].payment_method_name || payments[0].paymentMethodName || "-";
        }
        if (paymentMethodName === "-" && order.paidAt) {
            paymentMethodName = "Simulasi Pembayaran";
        }

        const standardTaxLabels = [
            "PKB Pokok", "PKB Denda", "SWDKLLJ Pokok", "SWDKLLJ Denda",
            "PNB STNK", "PNB TNKB", "OPSEN PKB Pokok", "OPSEN PKB Denda"
        ];

        const rawTaxFees = orderDetailFees.filter(f => f.order_fee_group === 1);
        const biayaPajak = standardTaxLabels.map(label => {
            const match = rawTaxFees.find(f => {
                const name = f.fee_name;
                if (name === label) return true;
                if (label === "SWDKLLJ Pokok" && name === "SWDKLLJ") return true;
                if (label === "OPSEN PKB Pokok" && name === "Opsen Pokok PKB") return true;
                return false;
            });
            return {
                label,
                value: formatCurrency(match ? match.value : 0)
            };
        });
        
        const subTotalBiayaPajak = formatCurrency(biayaPajak.reduce((acc, curr) => acc + parseIDNumber(curr.value), 0));

        const biayaJasa = orderDetailFees
            .filter(f => f.order_fee_group >= 2 && f.order_fee_group < 100 && f.fee_name !== "Pajak Metode Pembayaran")
            .map(f => ({ label: f.fee_name, value: formatCurrency(f.value) }));
        
        const subTotalBiayaJasa = formatCurrency(biayaJasa.reduce((acc, curr) => acc + parseIDNumber(curr.value), 0));

        return {
            id: order.orderId,
            orderId: order.orderId,
            tanggal: formatDate(order.createdAt),
            name: order.customerName || "-",
            layanan: serviceName,
            phoneNumber: order.phoneNumber || "-",
            kota: orderAddress?.city_name || "-",
            status_pembayaran: order.paidAt ? "Sudah Bayar" : "Belum Bayar",
            platform: "WEB - JABAR",
            harga: formatCurrency(Number(order.price)),
            bookingId: order.bookingId,
            serviceName: serviceName,
            plateNumber: order.plateNumber || "-",
            vehicleType: vehicleType,
            totalAmount: formatCurrency(Number(order.price)),
            finalTotal: Number(order.price),
            price: Number(order.price),
            paymentMethodName: paymentMethodName,
            orderDate: formatDate(order.createdAt),
            status: statusTitle,
            payments: payments.map(p => ({
                id: p.id,
                paymentMethodName: p.payment_method_name,
                paymentMethodType: p.payment_method_type,
                status: p.status,
                paidAt: p.paid_at || order.paidAt,
                amount: p.amount,
                paymentDetails: p.payment_details
            })),
            detail: {
                metode_pembayaran: paymentMethodName,
                alamat_penjemputan: {
                    kota: orderAddress?.city_name || "-",
                    detail: orderAddress?.raw_address || "-",
                    maps: (orderAddress?.latitude && orderAddress?.longitude) 
                        ? `https://maps.google.com/?q=${orderAddress.latitude},${orderAddress.longitude}` 
                        : "-",
                },
                status_detail: {
                    status: statusTitle,
                    status_pembayaran_detail: order.paidAt ? "SUDAH DIBAYAR" : "MENUNGGU PEMBAYARAN",
                    kurir: "-",
                    serah_terima_dokumen: "BELUM DI TERIMA",
                },
                perpanjangan_pajak: {
                    jenis_kendaraan: vehicleType,
                    nomor_plat: order.plateNumber || "-",
                    pkb_terakhir: formatCurrency(parseIDNumber(pkbTerakhir)), 
                    masa_berlaku_pkb: masaBerlakuPajak,
                    total_harga: formatCurrency(Number(order.price)),
                    biaya_jasa: subTotalBiayaJasa,
                },
                form_data: formDataRecord ? {
                    id: formDataRecord.id,
                    form_token: formDataRecord.form_token,
                    form_data: formDataRecord.form_data
                } : null,
                dokumen_order: docs.map(d => ({
                    label: d.type || "Dokumen",
                    url: d.document
                })),
                rincian_pembayaran: {
                    biaya_pajak: biayaPajak,
                    sub_total_biaya_pajak: subTotalBiayaPajak,
                    biaya_jasa_jumpapay: biayaJasa,
                    sub_total_biaya_jasa_jumpapay: subTotalBiayaJasa,
                }
            },
            cancelReason,
            orderStatusId: currentStatusId,
            email: order.email || "-",
            steps: await this.buildStatusSteps(currentStatusId),
        };
    },

    async getPaymentStatus(orderId: string) {
        const order = await this.getOrderById(orderId);
        if (!order) return null;

        const isPaid = !!order.paidAt || [3, 4, 5, 6].includes(order.orderStatusId);
        const isCancelled = order.orderStatusId === 8;

        let status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" = "PENDING";

        const createdAtDate = new Date(order.createdAt);
        const now = new Date();
        const diffHours = (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);

        if (isPaid) status = "PAID";
        else if (isCancelled || (order.orderStatusId === 7 && diffHours > 24)) status = "CANCELLED";

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
            .where("id", order.orderId);

        logger.info({ orderId: order.orderId }, "Order cancelled");
        return true;
    },

    async updateOrderStatus(orderId: string, statusId: number) {

        let targetId = orderId;
        const isLikelyBookingId = orderId.length < 20 || /^[A-Z]{2,6}\d{5}$/i.test(orderId);
        if (isLikelyBookingId) {
            const order = await this.getOrderByBookingId(orderId);
            if (order) targetId = order.orderId;
        }

        const updated = await transaction.Orders.query()
            .patch({ order_status_id: statusId } as any)
            .where("id", targetId);

        if (!updated) return null;

        logger.info({ orderId: targetId, statusId }, "Order status updated");
        return { orderId: targetId, statusId };
    },

    async createRefund(orderId: string, data: RefundRequest) {

        const order = await transaction.Orders.query().where("id", orderId).first();
        if (!order) throw new Error("Order not found");


        return {
            orderId,
            refundStatus: "SUBMITTED",
            estimatedCompletion: "3-5 Hari Kerja",
        };
    },

    async simulatePayment(idOrBookingId: string) {
        const searchId = idOrBookingId.trim();
        logger.info({ searchId }, "Starting payment simulation");

        let orderId: string | null = null;
        const matched = await (transaction.Orders as any).query()
            .whereRaw("LOWER(orders.booking_id) = ?", [searchId.toLowerCase()])
            .orWhere("orders.id", searchId)
            .first();

        if (matched) {
            orderId = matched.id;
        } else {
            const pmnt = await db("transaction.payments")
                .whereRaw("LOWER(invoice_number) = ?", [searchId.toLowerCase()])
                .orWhere("id", searchId)
                .first();

            if (pmnt) {
                const pi = await db("transaction.payment_items").where("payment_id", pmnt.id).first();
                if (pi) orderId = pi.order_id;
            }
        }

        if (!orderId) {
            logger.warn({ searchId }, "No match found for payment simulation");
            return null;
        }

        const orderRecord = await (transaction.Orders as any).query().where("id", orderId).select("booking_id").first();
        const bookingId = orderRecord?.booking_id || "";

        try {
            await db.transaction(async (trx) => {
                await trx("transaction.orders")
                    .where("id", orderId)
                    .update({
                        order_status_id: 3,
                        paid_at: new Date().toISOString()
                    });

                const pItems = await trx("transaction.payment_items")
                    .where("order_id", orderId)
                    .select("payment_id");

                const pIds = pItems.map(item => item.payment_id);
                if (pIds.length > 0) {
                    await trx("transaction.payments")
                        .whereIn("id", pIds)
                        .update({ 
                            status: "PAID",
                            paid_at: new Date().toISOString()
                        });
                }
            });

            logger.info({ orderId, bookingId }, "Payment simulation successful");

            this.getOrderDetail(bookingId).then((orderDetail) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const emailToSend = orderDetail?.email;
                logger.info({ orderId, bookingId, emailToSend }, "Attempting to send LUNAS email");

                if (orderDetail && emailToSend && emailRegex.test(emailToSend)) {
                    logger.info({ to: emailToSend }, "Sending sendOrderConfirmation...");
                    emailService.sendOrderConfirmation(emailToSend, orderDetail.name, orderDetail)
                        .then(() => logger.info({ to: emailToSend }, "LUNAS email sent successfully"))
                        .catch(err => logger.error({ err, orderId, to: emailToSend }, "Error sending LUNAS email"));
                } else {
                    logger.warn({ orderId, emailToSend }, "Skipping email: no valid email on order");
                }
            }).catch(err => logger.error({ err, orderId }, "Error fetching order detail for notification"));

            return { orderId, bookingId, status: "PAID" };
        } catch (err) {
            logger.error({ err, orderId }, "Payment simulation transaction failed");
            throw err;
        }
    }
};

export default orderService;
