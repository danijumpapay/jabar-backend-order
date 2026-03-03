import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@config/logger";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const PUBLIC_ENDPOINT = process.env.OBJECT_STORAGE_PUBLIC_END_POINT || "";
const BUCKET = process.env.OBJECT_STORAGE_BUCKET || "";

const uploadService = {
    async uploadBuffer(
        buffer: Buffer,
        originalName: string,
        folder: string = "documents"
    ): Promise<string> {
        const ext = path.extname(originalName);
        const key = `${folder}/${uuidv4()}${ext}`;

        try {
            const AWS = require("aws-sdk");
            const s3 = new AWS.S3({
                endpoint: process.env.OBJECT_STORAGE_END_POINT,
                accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID,
                secretAccessKey: process.env.OBJECT_STORAGE_ACCESS_KEY_SECRET,
                s3ForcePathStyle: true,
                signatureVersion: "v4",
            });

            await s3.putObject({
                Bucket: BUCKET,
                Key: key,
                Body: buffer,
                ACL: "public-read",
            }).promise();

            const publicUrl = `${PUBLIC_ENDPOINT}/${BUCKET}/${key}`;
            logger.info({ key, publicUrl }, "File uploaded to object storage");
            return publicUrl;
        } catch (err) {
            logger.error({ err }, "Upload to S3 failed");
            throw new Error("Gagal mengunggah file ke storage");
        }
    },
};

export default uploadService;
