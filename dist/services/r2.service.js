import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import crypto from "crypto";
const s3 = new S3Client({
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
    },
    region: "auto",
});
export async function uploadBuffer(file) {
    const fileExtension = file.originalname.split(".").pop();
    const fileKey = `consultations/${crypto.randomUUID()}.${fileExtension}`;
    await s3.send(new PutObjectCommand({
        Bucket: env.r2.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    }));
    // Return the public URL to retrieve the file
    const secure_url = `${env.r2.publicUrl}/${fileKey}`;
    return { secure_url };
}
