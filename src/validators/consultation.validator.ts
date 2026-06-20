import { body } from "express-validator";

export const consultationRules = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("age").isInt({ min: 1, max: 120 }).toInt().withMessage("Age must be between 1 and 120"),
  body("gender").isString().trim().isIn(["female", "male", "other"]).withMessage("Invalid gender selected"),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }).withMessage("Phone number must be valid"),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail().withMessage("Email must be valid"),
  body("address").isString().trim().isLength({ min: 5, max: 500 }).withMessage("Address must be between 5 and 500 characters"),
  body("payment_category").isString().trim().isIn(["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff", "others"]).withMessage("Invalid payment category"),
  body("consultation_fee").isInt({ min: 150, max: 400 }).toInt().withMessage("Consultation fee must be valid"),
  body("aadhaar_no").optional({ values: "falsy", checkFalsy: true }).isString().trim().isLength({ min: 12, max: 12 }).withMessage("Aadhaar number must be exactly 12 digits"),
  body("preferred_date")
    .isISO8601()
    .withMessage("Preferred date must be a valid date YYYY-MM-DD")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        throw new Error("Preferred date cannot be in the past");
      }
      return true;
    }),
  body("preferred_time")
    .isString()
    .trim()
    .isIn([
      "10:00 - 10:30",
      "10:30 - 11:00",
      "11:00 - 11:30",
      "11:30 - 12:00",
      "12:00 - 12:30",
      "12:30 - 13:00",
      "13:00 - 13:30",
      "13:30 - 14:00",
      "17:00 - 17:30",
      "17:30 - 18:00",
      "18:00 - 18:30",
      "18:30 - 19:00",
      "19:00 - 19:30",
      "19:30 - 20:00"
    ])
    .withMessage("Invalid preferred time interval"),
  body("razorpay_order_id").isString().trim().notEmpty().withMessage("Razorpay order ID is required"),
  body("razorpay_payment_id").isString().trim().notEmpty().withMessage("Razorpay payment ID is required"),
  body("razorpay_signature").isString().trim().notEmpty().withMessage("Razorpay signature is required"),
];
