import { body } from "express-validator";
export const appointmentRules = [
    body("patient_name").isString().trim().isLength({ min: 2, max: 120 }),
    body("phone").isString().trim().isLength({ min: 10, max: 20 }),
    body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
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
    body("message").isString().trim().isLength({ min: 5, max: 1000 }),
];
