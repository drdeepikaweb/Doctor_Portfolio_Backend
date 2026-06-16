import { Router } from "express";
import { createConsultation } from "../controllers/consultation.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { consultationRules } from "../validators/consultation.validator.js";
export const consultationRouter = Router();
consultationRouter.post("/", upload.array("documents", 5), sanitizeBody, consultationRules, validate, createConsultation);
