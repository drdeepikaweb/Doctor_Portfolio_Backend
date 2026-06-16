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

export async function listAppointments(_req: AuthenticatedDoctorRequest, res: Response) {
  const appointments = await prisma.appointment.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  res.json({ appointments });
}

export async function listConsultations(_req: AuthenticatedDoctorRequest, res: Response) {
  const consultations = await prisma.consultation.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  res.json({ consultations });
}
