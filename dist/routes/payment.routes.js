import { Router } from "express";
import { verifyPayment } from "../controllers/payment.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
export const paymentRouter = Router();
paymentRouter.post("/verify", sanitizeBody, verifyPayment);
