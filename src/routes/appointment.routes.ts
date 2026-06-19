import { Router } from "express";
import { createAppointment, getFullDates } from "../controllers/appointment.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { appointmentRules } from "../validators/appointment.validator.js";

export const appointmentRouter = Router();

appointmentRouter.get("/full-dates", getFullDates);
appointmentRouter.post("/", upload.single("id_document"), sanitizeBody, appointmentRules, validate, createAppointment);
