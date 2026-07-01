import { body } from "express-validator";
export const createDoctorRules = [
    body("name").isString().trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
];
export const loginDoctorRules = [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 128 }),
];
export const requestResetPasswordRules = [
    body("email").isEmail().normalizeEmail(),
];
export const verifyResetPasswordOtpRules = [
    body("email").isEmail().normalizeEmail(),
    body("otp").isString().isLength({ min: 6, max: 6 }),
];
export const resetPasswordRules = [
    body("email").isEmail().normalizeEmail(),
    body("otp").isString().isLength({ min: 6, max: 6 }),
    body("password").isString().isLength({ min: 8, max: 128 }),
];
