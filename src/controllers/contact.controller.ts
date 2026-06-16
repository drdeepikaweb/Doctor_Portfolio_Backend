import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { notifyClinic } from "../services/notification.service.js";

export async function createContactMessage(req: Request, res: Response) {
  const contact = await prisma.contactMessage.create({
    data: {
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone,
      message: req.body.message,
    },
  });

  await notifyClinic(
    "New contact form submission",
    `<h2>Contact Message</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Phone:</strong> ${contact.phone}</p><p><strong>Email:</strong> ${contact.email || "Not provided"}</p><p>${contact.message}</p>`,
    `New contact form submission\nName: ${contact.name}\nPhone: ${contact.phone}\nEmail: ${contact.email || "Not provided"}\nMessage: ${contact.message}`,
  );

  res.status(201).json({ message: "Contact message created", contact });
}
