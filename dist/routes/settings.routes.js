import { Router } from "express";
import { getSetting, saveSetting, getAllSettings } from "../controllers/settings.controller.js";
import { requireDoctorAuth } from "../middleware/doctor-auth.js";
import { sanitizeBody } from "../middleware/sanitize.js";
export const settingsRouter = Router();
settingsRouter.get("/", getAllSettings);
settingsRouter.get("/:key", getSetting);
settingsRouter.post("/:key", requireDoctorAuth, sanitizeBody, saveSetting);
