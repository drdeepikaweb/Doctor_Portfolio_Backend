import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { sendClinicEmail } from "../services/email.service.js";

export async function createContactMessage(req: Request, res: Response) {
  const contact = await prisma.contactMessage.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
    },
  });

  await sendClinicEmail(
    "New contact form submission",
    `<h2>Contact Message</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Phone:</strong> ${contact.phone}</p><p><strong>Email:</strong> ${contact.email}</p><p>${contact.message}</p>`,
  );

  res.status(201).json({ message: "Contact message created", contact });
}
