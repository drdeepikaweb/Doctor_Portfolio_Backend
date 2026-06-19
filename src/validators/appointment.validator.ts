import { body } from "express-validator";

export const appointmentRules = [
  body("patient_name").isString().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }).withMessage("Phone number must be valid"),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail().withMessage("Email must be valid"),
  body("preferred_date")
    .isISO8601()
    .custom((value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return selectedDate >= today;
    })
    .withMessage("Preferred date cannot be in the past")
    .toDate(),
  body("preferred_time").isString().trim().notEmpty().withMessage("Preferred time is required"),
  body("payment_category").isString().trim().isIn(["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff", "others"]).withMessage("Invalid payment category"),
  body("aadhaar_no").optional({ values: "falsy", checkFalsy: true }).isString().trim().isLength({ min: 12, max: 12 }).withMessage("Aadhaar number must be exactly 12 digits"),
  body("razorpay_order_id").isString().trim().notEmpty().withMessage("Razorpay order ID is required"),
  body("razorpay_payment_id").isString().trim().notEmpty().withMessage("Razorpay payment ID is required"),
  body("razorpay_signature").isString().trim().notEmpty().withMessage("Razorpay signature is required"),
  body("message").isString().trim().isLength({ min: 5, max: 1000 }).withMessage("Message must be between 5 and 1000 characters"),
];
