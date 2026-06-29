import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { AuthenticatedDoctorRequest } from "../middleware/doctor-auth.js";
import { createSessionToken, hashPassword, hashToken, verifyPassword } from "../services/auth.service.js";

const sessionDays = 7;

export async function createDoctorAccount(req: Request, res: Response) {
  try {
    const doctor = await prisma.doctor.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password_hash: await hashPassword(req.body.password),
      },
      select: { id: true, name: true, email: true, is_active: true, created_at: true },
    });

    res.status(201).json({ message: "Doctor account created", doctor });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "A doctor account with this email already exists" });
    }
    throw error;
  }
}

export async function loginDoctor(req: Request, res: Response) {
  const doctor = await prisma.doctor.findUnique({ where: { email: req.body.email } });

  if (!doctor || !doctor.is_active || !(await verifyPassword(req.body.password, doctor.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.doctorSession.create({
    data: {
      doctor_id: doctor.id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    },
  });

  res.json({
    token,
    expires_at: expiresAt,
    doctor: { id: doctor.id, name: doctor.name, email: doctor.email },
  });
}

export async function getDoctorProfile(req: AuthenticatedDoctorRequest, res: Response) {
  res.json({ doctor: req.doctor });
}

export async function logoutDoctor(req: AuthenticatedDoctorRequest, res: Response) {
  if (req.sessionToken) {
    await prisma.doctorSession.deleteMany({ where: { token_hash: hashToken(req.sessionToken) } });
  }

  res.json({ message: "Logged out" });
}

export async function listContactMessages(_req: AuthenticatedDoctorRequest, res: Response) {
  const contacts = await prisma.contactMessage.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  res.json({ contacts });
}

export async function listConsultations(_req: AuthenticatedDoctorRequest, res: Response) {
  const consultations = await prisma.consultation.findMany({
    where: {
      OR: [
        { is_reconsultation: true },
        { payment_verified: true }
      ]
    },
    orderBy: [
      { preferred_date: "asc" },
      { preferred_time: "asc" },
      { created_at: "desc" }
    ],
    take: 200,
  });

  res.json({ consultations });
}

export async function getConsultationDetails(req: AuthenticatedDoctorRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      res.status(404).json({ message: "Consultation not found" });
      return;
    }

    // Find other consultations with same name and phone
    const history = await prisma.consultation.findMany({
      where: {
        name: consultation.name,
        phone: consultation.phone,
        id: { not: id },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ consultation, history });
  } catch (error: any) {
    console.error("Get consultation details error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch details" });
  }
}

export async function completeConsultation(req: AuthenticatedDoctorRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const consultation = await prisma.consultation.update({
      where: { id },
      data: { is_completed: true },
    });

    res.json({ message: "Consultation marked as completed", consultation });
  } catch (error: any) {
    console.error("Complete consultation error:", error);
    res.status(500).json({ message: error.message || "Failed to complete consultation" });
  }
}
