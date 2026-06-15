import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

export async function sendClinicEmail(subject: string, html: string) {
  if (!env.smtp.host || !env.clinicEmail) return;

  await transporter.sendMail({
    from: env.smtp.user || env.clinicEmail,
    to: env.clinicEmail,
    subject,
    html,
  });
}
