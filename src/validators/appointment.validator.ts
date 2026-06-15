import { body } from "express-validator";

export const appointmentRules = [
  body("patient_name").isString().trim().isLength({ min: 2, max: 120 }),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }),
  body("email").isEmail().normalizeEmail(),
  body("preferred_date").isISO8601().toDate(),
  body("message").isString().trim().isLength({ min: 5, max: 1000 }),
];
