import { body } from "express-validator";

export const consultationRules = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("age").isInt({ min: 1, max: 120 }).toInt().withMessage("Age must be between 1 and 120"),
  body("gender").isString().trim().isIn(["female", "male", "other"]).withMessage("Invalid gender selected"),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }).withMessage("Phone number must be valid"),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail().withMessage("Email must be valid"),
  body("address").isString().trim().isLength({ min: 5, max: 500 }).withMessage("Address must be between 5 and 500 characters"),
  body("symptoms").isString().trim().isLength({ min: 10, max: 2000 }).withMessage("Describe symptoms in at least 10 characters"),
  body("payment_category").isString().trim().isIn(["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff", "others"]).withMessage("Invalid payment category"),
  body("consultation_fee").isInt({ min: 150, max: 400 }).toInt().withMessage("Consultation fee must be valid"),
  body("aadhaar_no").optional({ values: "falsy", checkFalsy: true }).isString().trim().isLength({ min: 12, max: 12 }).withMessage("Aadhaar number must be exactly 12 digits"),
  body("razorpay_order_id").isString().trim().notEmpty().withMessage("Razorpay order ID is required"),
  body("razorpay_payment_id").isString().trim().notEmpty().withMessage("Razorpay payment ID is required"),
  body("razorpay_signature").isString().trim().notEmpty().withMessage("Razorpay signature is required"),
];
