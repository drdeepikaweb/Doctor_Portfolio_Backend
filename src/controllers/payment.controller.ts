import { Request, Response } from "express";
import { env } from "../config/env.js";
import { razorpay } from "../config/razorpay.js";

const feeMapping: Record<string, number> = {
  iitr_student: 150,
  others: 350,
};

export async function createOrder(req: Request, res: Response) {
  try {
    const { payment_category } = req.body;

    if (!payment_category || !(payment_category in feeMapping)) {
      res.status(400).json({ message: "Invalid payment category" });
      return;
    }

    const feeInRupees = feeMapping[payment_category];
    const amountInPaise = feeInRupees * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpay.keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ message: error.message || "Failed to create payment order" });
  }
}
