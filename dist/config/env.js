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
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        chatId: process.env.TELEGRAM_CHAT_ID || "",
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        keySecret: process.env.RAZORPAY_KEY_SECRET || "dummysecret",
    },
    phonepe: {
        clientId: process.env.PHONEPE_CLIENT_ID || "PGTESTPAYUAT",
        clientSecret: process.env.PHONEPE_CLIENT_SECRET || "dummysecret",
        clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1",
        oauthUrl: process.env.PHONEPE_OAUTH_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
        checkoutUrl: process.env.PHONEPE_CHECKOUT_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
        statusUrl: process.env.PHONEPE_STATUS_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order",
    },
};
