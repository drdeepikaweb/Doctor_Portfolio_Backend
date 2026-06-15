import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { uploadBuffer } from "../services/cloudinary.service.js";
import { sendClinicEmail } from "../services/email.service.js";

export async function createConsultation(req: Request, res: Response) {
  let documentUrl: string | undefined;

  if (req.file) {
    const upload = await uploadBuffer(req.file);
    documentUrl = upload.secure_url;
  }

  const consultation = await prisma.consultation.create({
    data: {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      symptoms: req.body.symptoms,
      document_url: documentUrl,
    },
  });

  await sendClinicEmail(
    "New online consultation request",
    `<h2>Online Consultation</h2><p><strong>Name:</strong> ${consultation.name}</p><p><strong>Age:</strong> ${consultation.age}</p><p><strong>Gender:</strong> ${consultation.gender}</p><p><strong>Phone:</strong> ${consultation.phone}</p><p><strong>Email:</strong> ${consultation.email}</p><p><strong>Address:</strong> ${consultation.address}</p><p><strong>Symptoms:</strong> ${consultation.symptoms}</p><p><strong>Document:</strong> ${documentUrl || "Not uploaded"}</p>`,
  );

  res.status(201).json({ message: "Consultation created", consultation });
}
