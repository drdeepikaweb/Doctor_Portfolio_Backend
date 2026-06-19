import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Prisma } from "@prisma/client";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "./config/env.js";
import { appointmentRouter } from "./routes/appointment.routes.js";
import { consultationRouter } from "./routes/consultation.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { doctorRouter } from "./routes/doctor.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { visitorRouter } from "./routes/visitor.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
export const app = express();
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(hpp());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use("/api/health", healthRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/consultations", consultationRouter);
app.use("/api/contact", contactRouter);
app.use("/api/visitors", visitorRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/payments", paymentRouter);
app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});
app.use((error, _req, res, _next) => {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return res.status(503).json({
            message: "Database is unavailable. Please make sure PostgreSQL is running and DATABASE_URL is correct.",
        });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
});
