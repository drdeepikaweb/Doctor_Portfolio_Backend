import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";

export async function getSetting(req: Request, res: Response) {
  try {
    const key = req.params.key as string;
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    res.json({ key, value: setting ? setting.value : "" });
  } catch (error: any) {
    console.error("Get setting error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch setting" });
  }
}

export async function saveSetting(req: Request, res: Response) {
  try {
    const key = req.params.key as string;
    const { value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value: String(value) },
    });

    res.json({ key, value: setting.value });
  } catch (error: any) {
    console.error("Save setting error:", error);
    res.status(500).json({ message: error.message || "Failed to save setting" });
  }
}
