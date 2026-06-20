import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { uploadBuffer } from "../services/r2.service.js";
import { notifyClinic } from "../services/notification.service.js";

const paymentLabels: Record<string, string> = {
  iitr_student: "IITR Students",
  iitr_faculty_staff: "IITR Faculty/Staff",
  iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
  others: "All Others",
};

export async function createConsultation(req: Request, res: Response) {
  try {
    const {
      name,
      age,
      gender,
      phone,
      email,
      address,
      symptoms,
      payment_category,
      consultation_fee,
      aadhaar_no,
      preferred_date,
      preferred_time,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Verify slot capacity (max 5 consultations per 30-min interval on a preferred_date)
    const selectedDate = new Date(preferred_date);
    selectedDate.setHours(0, 0, 0, 0);

    const count = await prisma.consultation.count({
      where: {
        preferred_date: selectedDate,
        preferred_time: preferred_time,
      },
    });

    if (count >= 5) {
      res.status(400).json({ message: "This time slot is fully booked. Please choose another slot." });
      return;
    }

    // Verify payment signature
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ message: "Payment details are required" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ message: "Payment verification failed. Invalid signature." });
      return;
    }

    // Extract files from fields
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const documentFiles = filesObj?.documents || [];
    const idFile = filesObj?.id_document?.[0];

    // Conditional requirement checks
    const discountCategories = ["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff"];
    let id_document_url = null;

    if (discountCategories.includes(payment_category)) {
      if (!idFile) {
        res.status(400).json({ message: "Student ID/ IITR Employee ID/Govt ID document upload is required for discount category" });
        return;
      }
      const upload = await uploadBuffer(idFile);
      id_document_url = upload.secure_url;
    } else if (payment_category === "others") {
      if (!aadhaar_no || aadhaar_no.trim().length !== 12) {
        res.status(400).json({ message: "Aadhaar No. must be exactly 12 digits for this category" });
        return;
      }
    }

    // Upload general health documents
    const documentUrls: string[] = [];
    for (const file of documentFiles) {
      const upload = await uploadBuffer(file);
      documentUrls.push(upload.secure_url);
    }

    const consultation = await prisma.consultation.create({
      data: {
        name,
        age: Number(age),
        gender,
        phone,
        email: email || null,
        address,
        symptoms,
        preferred_date: selectedDate,
        preferred_time,
        document_url: documentUrls[0] || null,
        document_urls: documentUrls,
        payment_category,
        consultation_fee: Number(consultation_fee),
        aadhaar_no: aadhaar_no || null,
        id_document_url,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });

    const paymentLabel = paymentLabels[payment_category] || payment_category || "Not selected";
    const documentText = documentUrls.length ? documentUrls.join(", ") : "Not uploaded";

    await notifyClinic(
      "New online consultation request (Paid)",
      `<h2>Online Consultation</h2>
       <p><strong>Name:</strong> ${consultation.name}</p>
       <p><strong>Age:</strong> ${consultation.age}</p>
       <p><strong>Gender:</strong> ${consultation.gender}</p>
       <p><strong>Phone:</strong> ${consultation.phone}</p>
       <p><strong>Email:</strong> ${consultation.email || "Not provided"}</p>
       <p><strong>Address:</strong> ${consultation.address}</p>
       <p><strong>Symptoms:</strong> ${consultation.symptoms}</p>
       <p><strong>Preferred Date:</strong> ${consultation.preferred_date ? consultation.preferred_date.toDateString() : "N/A"}</p>
       <p><strong>Preferred Time Slot:</strong> ${consultation.preferred_time || "N/A"}</p>
       <p><strong>Payment:</strong> ${paymentLabel} - Rs. ${consultation.consultation_fee}</p>
       <p><strong>Aadhaar No:</strong> ${consultation.aadhaar_no || "N/A"}</p>
       <p><strong>ID Document:</strong> ${consultation.id_document_url ? `<a href="${consultation.id_document_url}">View ID Document</a>` : "N/A"}</p>
       <p><strong>Razorpay Payment ID:</strong> ${consultation.razorpay_payment_id}</p>
       <p><strong>Medical Documents:</strong> ${documentText}</p>`,
      `New online consultation request\nName: ${consultation.name}\nAge: ${consultation.age}\nGender: ${consultation.gender}\nPhone: ${consultation.phone}\nPreferred Date: ${consultation.preferred_date ? consultation.preferred_date.toDateString() : "N/A"}\nPreferred Time: ${consultation.preferred_time || "N/A"}\nPayment: ${paymentLabel} - Rs. ${consultation.consultation_fee}\nAadhaar No: ${consultation.aadhaar_no || "N/A"}\nID Document: ${consultation.id_document_url || "N/A"}\nSymptoms: ${consultation.symptoms}`,
    );

    res.status(201).json({ message: "Consultation created successfully", consultation });
  } catch (error: any) {
    console.error("Consultation error:", error);
    res.status(500).json({ message: error.message || "Failed to create consultation" });
  }
}
