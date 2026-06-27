import { Router } from "express";
import { createConsultation } from "../controllers/consultation.controller.js";
import { sanitizeBody } from "../middleware/sanitize.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { consultationRules } from "../validators/consultation.validator.js";
import { prisma } from "../database/prisma.js";
import { generateTimeSlots } from "../utils/slots.js";
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
        // Fetch slot settings
        const gapSetting = await prisma.setting.findUnique({ where: { key: "slot_gap_minutes" } });
        const capacitySetting = await prisma.setting.findUnique({ where: { key: "patients_per_slot" } });
        // Fetch timing settings
        const morningStartSetting = await prisma.setting.findUnique({ where: { key: "morning_start" } });
        const morningEndSetting = await prisma.setting.findUnique({ where: { key: "morning_end" } });
        const morningEnabledSetting = await prisma.setting.findUnique({ where: { key: "morning_enabled" } });
        const eveningStartSetting = await prisma.setting.findUnique({ where: { key: "evening_start" } });
        const eveningEndSetting = await prisma.setting.findUnique({ where: { key: "evening_end" } });
        const eveningEnabledSetting = await prisma.setting.findUnique({ where: { key: "evening_enabled" } });
        const gapMinutes = gapSetting ? Number(gapSetting.value) : 30;
        const capacity = capacitySetting ? Number(capacitySetting.value) : 5;
        const slots = generateTimeSlots(gapMinutes, {
            morningStart: morningStartSetting?.value,
            morningEnd: morningEndSetting?.value,
            morningEnabled: morningEnabledSetting ? morningEnabledSetting.value === "true" : true,
            eveningStart: eveningStartSetting?.value,
            eveningEnd: eveningEndSetting?.value,
            eveningEnabled: eveningEnabledSetting ? eveningEnabledSetting.value === "true" : true,
        });
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
            .filter((group) => group._count.id >= capacity && group.preferred_time)
            .map((group) => group.preferred_time);
        res.json({ slots, blocked_slots });
    }
    catch (error) {
        console.error("Get booked slots error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch booked slots" });
    }
});
consultationRouter.get("/by-uhid/:uhid", async (req, res) => {
    try {
        const { uhid } = req.params;
        if (!uhid) {
            res.status(400).json({ message: "UHID parameter is required" });
            return;
        }
        const original = await prisma.consultation.findFirst({
            where: {
                submission_id: uhid.trim(),
            },
            orderBy: {
                created_at: "asc", // Original consultation
            },
        });
        if (!original) {
            res.status(404).json({ message: "No consultation found with this UHID" });
            return;
        }
        res.json({
            name: original.name,
            age: original.age,
            gender: original.gender,
            phone: original.phone,
            email: original.email,
            address: original.address,
            payment_category: original.payment_category,
            created_at: original.created_at,
        });
    }
    catch (error) {
        console.error("Get consultation by UHID error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch consultation details" });
    }
});
consultationRouter.post("/", upload.fields([
    { name: "documents", maxCount: 5 },
    { name: "id_document", maxCount: 1 },
]), sanitizeBody, consultationRules, validate, createConsultation);
