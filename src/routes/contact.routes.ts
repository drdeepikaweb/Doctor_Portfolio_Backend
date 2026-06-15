import { Router } from "express";
import { createContactMessage } from "../controllers/contact.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { validate } from "../middleware/validate.js";
import { contactRules } from "../validators/contact.validator.js";

export const contactRouter = Router();

contactRouter.post("/", sanitizeBody, contactRules, validate, createContactMessage);
