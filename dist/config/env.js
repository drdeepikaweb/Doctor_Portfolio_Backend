import dotenv from "dotenv";
dotenv.config();
export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    clinicEmail: process.env.CLINIC_EMAIL || "clinic@example.com",
    r2: {
        accountId: process.env.R2_ACCOUNT_ID || "",
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        bucketName: process.env.R2_BUCKET_NAME || "",
        publicUrl: process.env.R2_PUBLIC_URL || "",
    },
    smtp: {
        host: process.env.SMTP_HOST || "",
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
    whatsapp: {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        to: process.env.WHATSAPP_TO || "",
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        keySecret: process.env.RAZORPAY_KEY_SECRET || "dummysecret",
    },
};
