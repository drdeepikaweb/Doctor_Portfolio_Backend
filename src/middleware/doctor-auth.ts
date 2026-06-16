import { NextFunction, Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { hashToken } from "../services/auth.service.js";

export type AuthenticatedDoctorRequest = Request & {
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  sessionToken?: string;
};

export async function requireDoctorAuth(req: AuthenticatedDoctorRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Login required" });
  }

  const session = await prisma.doctorSession.findUnique({
    where: { token_hash: hashToken(token) },
    include: { doctor: true },
  });

  if (!session || session.expires_at < new Date() || !session.doctor.is_active) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }

  req.doctor = {
    id: session.doctor.id,
    name: session.doctor.name,
    email: session.doctor.email,
  };
  req.sessionToken = token;

  next();
}
