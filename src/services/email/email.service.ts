import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { logger } from "@config/logger";

class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `"JumpaPay" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
            });

            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error({ error }, "Error sending email");
            throw error;
        }
    }

    async sendOrderConfirmation(to: string, name: string, orderDetails: any, subject: string = "Konfirmasi Pembayaran JumpaPay") {
        try {
            const templatePath = path.join(__dirname, "templates", "order-confirmation.html");
            let html = fs.readFileSync(templatePath, "utf-8");

            html = html.replace(/{{NAME}}/g, name);
            html = html.replace(/{{ORDER_ID}}/g, orderDetails.bookingId || "-");
            html = html.replace(/{{SERVICE_NAME}}/g, orderDetails.serviceName || "-");
            html = html.replace(/{{PLATE_NUMBER}}/g, orderDetails.plateNumber || "-");
            html = html.replace(/{{VEHICLE_TYPE}}/g, orderDetails.vehicleType || "-");
            html = html.replace(/{{TOTAL_AMOUNT}}/g, orderDetails.totalAmount || "-");
            html = html.replace(/{{PAYMENT_METHOD}}/g, orderDetails.paymentMethodName || "-");
            html = html.replace(/{{TRANSACTION_DATE}}/g, orderDetails.orderDate || "-");
            html = html.replace(/{{STATUS}}/g, orderDetails.status || "-");

            await this.sendEmail(to, subject, html);
        } catch (error) {
            logger.error({ error }, "Error sending order confirmation email");
        }
    }
}

export const emailService = new EmailService();
