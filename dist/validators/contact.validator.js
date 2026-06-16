import { body } from "express-validator";
export const contactRules = [
    body("name").isString().trim().isLength({ min: 2, max: 120 }),
    body("phone").isString().trim().isLength({ min: 10, max: 20 }),
    body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
    body("message").isString().trim().isLength({ min: 5, max: 1000 }),
];
