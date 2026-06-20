import { Router } from "express";
import { createConsultation } from "../controllers/consultation.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { consultationRules } from "../validators/consultation.validator.js";
import { prisma } from "../database/prisma.js";
export const consultationRouter = Router();
consultationRouter.get("/booked-slots", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date || typeof date !== "string") {
            res.status(400).json({ message: "Date parameter is required" });
            return;
        }
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const counts = await prisma.consultation.groupBy({
            by: ["preferred_time"],
            where: {
                preferred_date: selectedDate,
            },
            _count: {
                id: true,
            },
        });
        const blocked_slots = counts
            .filter((group) => group._count.id >= 5 && group.preferred_time)
            .map((group) => group.preferred_time);
        res.json({ blocked_slots });
    }
    catch (error) {
        console.error("Get booked slots error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch booked slots" });
    }
});
consultationRouter.post("/", upload.fields([
    { name: "documents", maxCount: 5 },
    { name: "id_document", maxCount: 1 },
]), sanitizeBody, consultationRules, validate, createConsultation);
