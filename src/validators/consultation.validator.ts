import { body } from "express-validator";
import { prisma } from "../database/prisma.js";
import { generateTimeSlots } from "../utils/slots.js";

export const consultationRules = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("age").isInt({ min: 1, max: 120 }).toInt().withMessage("Age must be between 1 and 120"),
  body("gender").isString().trim().isIn(["female", "male", "other"]).withMessage("Invalid gender selected"),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }).withMessage("Phone number must be valid"),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail().withMessage("Email must be valid"),
  body("address").isString().trim().isLength({ min: 5, max: 500 }).withMessage("Address must be between 5 and 500 characters"),
  body("reconsultation_id").optional({ values: "falsy" }).isString().trim(),
  body("payment_category")
    .if((value: any, { req }: any) => !req.body.reconsultation_id)
    .isString().trim().isIn(["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff", "others"]).withMessage("Invalid payment category"),
  body("consultation_fee")
    .if((value: any, { req }: any) => !req.body.reconsultation_id)
    .isInt({ min: 150, max: 400 }).toInt().withMessage("Consultation fee must be valid"),
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
      
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);
      maxDate.setHours(23, 59, 59, 999);
      if (selectedDate > maxDate) {
        throw new Error("Preferred date must be within 1 week in the future");
      }
      return true;
    }),
  body("preferred_time")
    .isString()
    .trim()
    .custom(async (value) => {
      const gapSetting = await prisma.setting.findUnique({ where: { key: "slot_gap_minutes" } });
      const gapMinutes = gapSetting ? Number(gapSetting.value) : 30;

      const validSlots = generateTimeSlots(gapMinutes);
      if (!validSlots.includes(value)) {
        throw new Error("Invalid preferred time interval");
      }
      return true;
    }),
];
