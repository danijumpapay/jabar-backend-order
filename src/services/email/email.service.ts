import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { logger } from "@config/logger";

class EmailService {
    private transporter;

    constructor() {
        const port = Number(process.env.EMAIL_PORT);
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: port,
            secure: port === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Kang Pajak" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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

    async sendOrderConfirmation(to: string, name: string, orderDetails: any, subject: string = "Konfirmasi Pembayaran Kang Pajak") {
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
            html = html.replace(/{{YEAR}}/g, new Date().getFullYear().toString());

            await this.sendEmail(to, subject, html);
        } catch (error) {
            logger.error({ error }, "Error sending order confirmation email");
        }
    }

    async sendOrderCreated(to: string, name: string, orderDetails: any, paymentLink: string, subject: string = "Menunggu Pembayaran Kang Pajak") {
        try {
            const templatePath = path.join(__dirname, "templates", "order-created.html");
            let html = fs.readFileSync(templatePath, "utf-8");

            html = html.replace(/{{NAME}}/g, name);
            html = html.replace(/{{ORDER_ID}}/g, orderDetails.bookingId || "-");
            html = html.replace(/{{SERVICE_NAME}}/g, orderDetails.serviceName || "-");
            html = html.replace(/{{PLATE_NUMBER}}/g, orderDetails.plateNumber || "-");
            html = html.replace(/{{VEHICLE_TYPE}}/g, orderDetails.vehicleType || "-");
            html = html.replace(/{{TOTAL_AMOUNT}}/g, orderDetails.totalAmount || "-");
            html = html.replace(/{{PAYMENT_METHOD}}/g, orderDetails.paymentMethodName || "-");
            html = html.replace(/{{TRANSACTION_DATE}}/g, orderDetails.orderDate || "-");
            html = html.replace(/{{STATUS}}/g, orderDetails.status || "Menunggu Pembayaran");
            html = html.replace(/{{PAYMENT_LINK}}/g, paymentLink || "-");
            html = html.replace(/{{YEAR}}/g, new Date().getFullYear().toString());

            await this.sendEmail(to, subject, html);
        } catch (error) {
            logger.error({ error }, "Error sending order created email");
        }
    }
}

export const emailService = new EmailService();
