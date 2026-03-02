import { transaction, service } from "@jumpapay/jumpapay-models";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@config/logger";
import {
    CreateOrderRequest,
    RefundRequest,
    OrderStatusStep,
} from "@dataTypes/order";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateBookingId = (): string => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `KP${datePart}${randomPart}`;
};

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const ORDER_STATUS_STEPS: Record<number, OrderStatusStep[]> = {
    1: [
        { title: "Order Dibuat", completed: true },
        { title: "Verifikasi Dokumen", completed: false },
        { title: "Pengurusan Dokumen", completed: false },
        { title: "Pengantaran Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    2: [
        { title: "Order Dibuat", completed: true },
        { title: "Verifikasi Dokumen", completed: true },
        { title: "Pengurusan Dokumen", completed: false },
        { title: "Pengantaran Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    3: [
        { title: "Order Dibuat", completed: true },
        { title: "Verifikasi Dokumen", completed: true },
        { title: "Pengurusan Dokumen", completed: true },
        { title: "Pengantaran Dokumen", completed: false },
        { title: "Selesai", completed: false },
    ],
    4: [
        { title: "Order Dibuat", completed: true },
        { title: "Verifikasi Dokumen", completed: true },
        { title: "Pengurusan Dokumen", completed: true },
        { title: "Pengantaran Dokumen", completed: true },
        { title: "Selesai", completed: true },
    ],
    5: [ // Refund / Cancelled
        { title: "Pengajuan Pembatalan", completed: true },
        { title: "Verifikasi Admin", completed: false },
        { title: "Proses Refund", completed: false },
        { title: "Selesai", completed: false },
    ],
};

// ─── Order Service ────────────────────────────────────────────────────────────

const orderService = {
    /**
     * Create a new order.
     * Uses the same pattern as the WhatsApp bot:
     *   - Insert into transaction.Orders
     *   - Insert into transaction.order_details
     *   - Insert into transaction.order_detail_fees (for each fee component)
     */
    async createOrder(data: CreateOrderRequest, companyId: string) {
        const orderId = uuidv4();
        const bookingId = generateBookingId();

        // 1. Get service data (optional — future use for price override)
        // const serviceRow = await service.Services?.query().where("id", data.serviceId).first() as any;

        // 2. Find or create customer (by NIK or phone)
        let userId: string | null = null;

        // 3. Insert Order
        await transaction.Orders.query().insert({
            id: orderId,
            company_id: companyId,
            user_id: userId,
            booking_id: bookingId,
            source: "WEB",
            order_status_id: 1, // Pending / Menunggu Pembayaran
            price: data.finalTotal,
            email: data.email,
        } as any);

        // 4. Insert Order Detail
        const orderDetailId = uuidv4();
        await transaction.OrderDetails.query().insert({
            id: orderDetailId,
            order_id: orderId,
            service_id: data.serviceId,
            name: data.name,
            price: data.finalTotal,
        } as any);

        // 5. Insert Order Detail Fees (admin fee)
        const adminFee = 10000;
        await transaction.OrderDetailFees.query().insert({
            order_detail_id: orderDetailId,
            order_fee_name: "Biaya Admin",
            order_fee_group: 1,
            fee_name: "Biaya Admin",
            fee_group_name: "Admin",
            value: adminFee,
        } as any);

        if (data.deliveryFee > 0) {
            await transaction.OrderDetailFees.query().insert({
                order_detail_id: orderDetailId,
                order_fee_name: "Biaya Pengantaran",
                order_fee_group: 2,
                fee_name: "Biaya Pengantaran",
                fee_group_name: "Ongkir",
                value: data.deliveryFee,
            } as any);
        }

        logger.info({ orderId, bookingId }, "Order created successfully");

        return {
            orderId,
            bookingId,
        };
    },

    /**
     * Get order by bookingId or orderId.
     */
    async getOrderByBookingId(bookingId: string) {
        const order = await transaction.Orders.querySoftDelete()
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

        return order;
    },

    /**
     * Get order by orderId (internal UUID).
     */
    async getOrderById(orderId: string) {
        const order = await transaction.Orders.querySoftDelete()
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

        return order;
    },

    /**
     * Get service name from DB.
     */
    async getServiceName(serviceId: string): Promise<string> {
        try {
            const svc = await service.Services?.query().where("id", serviceId).first() as any;
            return svc?.name || "Layanan Kang Pajak";
        } catch {
            return "Layanan Kang Pajak";
        }
    },

    /**
     * Build the tracking steps based on orderStatusId.
     */
    buildStatusSteps(orderStatusId: number): OrderStatusStep[] {
        return ORDER_STATUS_STEPS[orderStatusId] || ORDER_STATUS_STEPS[1];
    },

    /**
     * Get order detail view for tracking page.
     */
    async getOrderDetail(bookingId: string) {
        const order = await this.getOrderByBookingId(bookingId);
        if (!order) return null;

        const serviceName = await this.getServiceName(order.serviceId);

        return {
            orderId: order.orderId,
            bookingId: order.bookingId,
            status: order.orderStatus || "Menunggu Pembayaran",
            orderStatusId: order.orderStatusId,
            nama: order.customerName || "-",
            email: order.email || "-",
            layanan: serviceName,
            harga: formatCurrency(Number(order.price)),
            tanggal: formatDate(order.createdAt),
            steps: this.buildStatusSteps(order.orderStatusId),
        };
    },

    /**
     * Get payment status for an order.
     */
    async getPaymentStatus(orderId: string) {
        const order = await this.getOrderById(orderId);
        if (!order) return null;

        const isPaid = !!order.paidAt;
        const isCancelled = order.orderStatusId === 6;
        const isExpired = order.orderStatusId === 7;

        let status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" = "PENDING";
        if (isPaid) status = "PAID";
        else if (isCancelled) status = "CANCELLED";
        else if (isExpired) status = "EXPIRED";

        return {
            paid: isPaid,
            status,
            paidAt: order.paidAt || null,
        };
    },

    /**
     * Cancel an order.
     */
    async cancelOrder(orderId: string) {
        const order = await this.getOrderById(orderId);
        if (!order) return null;

        if (order.paidAt) {
            throw new Error("Order yang sudah dibayar tidak dapat dibatalkan langsung");
        }

        await transaction.Orders.query()
            .patch({ order_status_id: 6 } as any)
            .where("id", orderId);

        logger.info({ orderId }, "Order cancelled");
        return true;
    },

    /**
     * Create a refund request.
     */
    async createRefund(orderId: string, data: RefundRequest) {
        // Insert to refund table or update order status to 5 (refund requested)
        await transaction.Orders.query()
            .patch({ order_status_id: 5 } as any)
            .where("id", orderId);

        logger.info({ orderId, bank: data.bank }, "Refund request created");
        return { refundId: uuidv4(), estimatedDays: 3 };
    },

    /**
     * Update order status to confirmed paid (for webhook use).
     */
    async markOrderAsPaid(orderId: string) {
        await transaction.Orders.query()
            .patch({
                order_status_id: 2,
                paid_at: new Date().toISOString(),
            } as any)
            .where("id", orderId);

        logger.info({ orderId }, "Order marked as paid");
    },
};

export default orderService;
