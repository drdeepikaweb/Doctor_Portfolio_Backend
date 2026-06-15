import { Router } from "express";
import { createAppointment } from "../controllers/appointment.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { validate } from "../middleware/validate.js";
import { appointmentRules } from "../validators/appointment.validator.js";

export const appointmentRouter = Router();

appointmentRouter.post("/", sanitizeBody, appointmentRules, validate, createAppointment);
