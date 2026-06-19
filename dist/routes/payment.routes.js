import { Router } from "express";
import { createOrder } from "../controllers/payment.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
export const paymentRouter = Router();
paymentRouter.post("/order", sanitizeBody, createOrder);
