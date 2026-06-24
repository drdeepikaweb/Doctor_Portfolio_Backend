import { prisma } from "../database/prisma.js";
export async function getSetting(req, res) {
    try {
        const key = req.params.key;
        const setting = await prisma.setting.findUnique({
            where: { key },
        });
        res.json({ key, value: setting ? setting.value : "" });
    }
    catch (error) {
        console.error("Get setting error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch setting" });
    }
}
export async function saveSetting(req, res) {
    try {
        const key = req.params.key;
        const { value } = req.body;
        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value: String(value) },
        });
        res.json({ key, value: setting.value });
    }
    catch (error) {
        console.error("Save setting error:", error);
        res.status(500).json({ message: error.message || "Failed to save setting" });
    }
}
