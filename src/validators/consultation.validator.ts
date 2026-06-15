import { body } from "express-validator";

export const consultationRules = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("age").isInt({ min: 1, max: 120 }).toInt(),
  body("gender").isString().trim().isIn(["female", "male", "other"]),
  body("phone").isString().trim().isLength({ min: 10, max: 20 }),
  body("email").isEmail().normalizeEmail(),
  body("address").isString().trim().isLength({ min: 5, max: 500 }),
  body("symptoms").isString().trim().isLength({ min: 10, max: 2000 }),
];
