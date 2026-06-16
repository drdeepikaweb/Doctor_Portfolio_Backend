import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { uploadBuffer } from "../services/cloudinary.service.js";
import { notifyClinic } from "../services/notification.service.js";

const paymentLabels: Record<string, string> = {
  iitr_student: "IITR Students",
  iitr_faculty_staff: "IITR Faculty/Staff",
  iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
  others: "All Others",
};

export async function createConsultation(req: Request, res: Response) {
  const files = Array.isArray(req.files) ? req.files : [];
  const documentUrls: string[] = [];

  for (const file of files) {
    const upload = await uploadBuffer(file);
    documentUrls.push(upload.secure_url);
  }

  const consultation = await prisma.consultation.create({
    data: {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      phone: req.body.phone,
      email: req.body.email || null,
      address: req.body.address,
      symptoms: req.body.symptoms,
      document_url: documentUrls[0],
      document_urls: documentUrls,
      payment_category: req.body.payment_category,
      consultation_fee: req.body.consultation_fee,
    },
  });

  const paymentLabel = paymentLabels[consultation.payment_category || ""] || consultation.payment_category || "Not selected";
  const documentText = documentUrls.length ? documentUrls.join(", ") : "Not uploaded";

  await notifyClinic(
    "New online consultation request",
    `<h2>Online Consultation</h2><p><strong>Name:</strong> ${consultation.name}</p><p><strong>Age:</strong> ${consultation.age}</p><p><strong>Gender:</strong> ${consultation.gender}</p><p><strong>Phone:</strong> ${consultation.phone}</p><p><strong>Email:</strong> ${consultation.email || "Not provided"}</p><p><strong>Address:</strong> ${consultation.address}</p><p><strong>Symptoms:</strong> ${consultation.symptoms}</p><p><strong>Payment:</strong> ${paymentLabel} - Rs. ${consultation.consultation_fee}</p><p><strong>Documents:</strong> ${documentText}</p>`,
    `New online consultation request\nName: ${consultation.name}\nAge: ${consultation.age}\nGender: ${consultation.gender}\nPhone: ${consultation.phone}\nEmail: ${consultation.email || "Not provided"}\nPayment: ${paymentLabel} - Rs. ${consultation.consultation_fee}\nSymptoms: ${consultation.symptoms}\nDocuments: ${documentText}`,
  );

  res.status(201).json({ message: "Consultation created", consultation });
}
