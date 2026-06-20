import { Router } from "express";
import {
  createDoctorAccount,
  getDoctorProfile,
  getConsultationDetails,
  completeConsultation,
  listConsultations,
  listContactMessages,
  loginDoctor,
  logoutDoctor,
} from "../controllers/doctor.controller.js";
import { requireDoctorAuth } from "../middleware/doctor-auth.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { validate } from "../middleware/validate.js";
import { createDoctorRules, loginDoctorRules } from "../validators/doctor.validator.js";

export const doctorRouter = Router();

doctorRouter.post("/setup", sanitizeBody, createDoctorRules, validate, createDoctorAccount);
doctorRouter.post("/login", sanitizeBody, loginDoctorRules, validate, loginDoctor);
doctorRouter.get("/me", requireDoctorAuth, getDoctorProfile);
doctorRouter.post("/logout", requireDoctorAuth, logoutDoctor);
doctorRouter.get("/contacts", requireDoctorAuth, listContactMessages);
doctorRouter.get("/consultations", requireDoctorAuth, listConsultations);
doctorRouter.get("/consultations/:id", requireDoctorAuth, getConsultationDetails);
doctorRouter.post("/consultations/:id/complete", requireDoctorAuth, completeConsultation);
