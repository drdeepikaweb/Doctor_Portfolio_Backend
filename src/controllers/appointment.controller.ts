import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { uploadBuffer } from "../services/cloudinary.service.js";
import { sendClinicEmail } from "../services/email.service.js";

const feeMapping: Record<string, number> = {
  iitr_student: 150,
  iitr_faculty_staff: 350,
  iitr_retired_faculty_staff: 250,
  others: 400,
};

const paymentLabels: Record<string, string> = {
  iitr_student: "IITR Students",
  iitr_faculty_staff: "IITR Faculty/Staff",
  iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
  others: "All Others",
};

export async function createAppointment(req: Request, res: Response) {
  try {
    const {
      patient_name,
      phone,
      email,
      preferred_date,
      preferred_time,
      payment_category,
      aadhaar_no,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      message,
    } = req.body;

    // Validate preferred date is not full
    const selectedDate = new Date(preferred_date);
    selectedDate.setHours(0, 0, 0, 0);

    const count = await prisma.appointment.count({
      where: {
        preferred_date: selectedDate,
      },
    });

    const maxSetting = await prisma.setting.findUnique({ where: { key: "max_appointments_per_day" } });
    const maxAppointments = maxSetting ? parseInt(maxSetting.value, 10) : 50;

    if (count >= maxAppointments) {
      res.status(400).json({ message: `Appointments are full for ${selectedDate.toDateString()}` });
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

    // Conditional requirement checks
    const discountCategories = ["iitr_student", "iitr_faculty_staff", "iitr_retired_faculty_staff"];
    let id_document_url = null;

    if (discountCategories.includes(payment_category)) {
      const file = req.file || (req.files && (req.files as any)[0]);
      if (!file) {
        res.status(400).json({ message: "Student ID/ IITR Employee ID/Govt ID document upload is required for discount category" });
        return;
      }
      const upload = await uploadBuffer(file);
      id_document_url = upload.secure_url;
    } else if (payment_category === "others") {
      if (!aadhaar_no || aadhaar_no.trim().length !== 12) {
        res.status(400).json({ message: "Aadhaar No. must be exactly 12 digits for this category" });
        return;
      }
    }

    const fee = feeMapping[payment_category] || 0;

    const appointment = await prisma.appointment.create({
      data: {
        patient_name,
        phone,
        email: email || null,
        preferred_date: selectedDate,
        preferred_time,
        payment_category,
        consultation_fee: fee,
        aadhaar_no: aadhaar_no || null,
        id_document_url,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        message,
      },
    });

    const paymentLabel = paymentLabels[payment_category] || payment_category || "Not selected";

    await sendClinicEmail(
      "New appointment request (Paid)",
      `<h2>New Appointment</h2>
       <p><strong>Patient Name:</strong> ${appointment.patient_name}</p>
       <p><strong>Phone:</strong> ${appointment.phone}</p>
       <p><strong>Email:</strong> ${appointment.email || "Not provided"}</p>
       <p><strong>Preferred Date:</strong> ${appointment.preferred_date.toDateString()}</p>
       <p><strong>Preferred Time:</strong> ${appointment.preferred_time}</p>
       <p><strong>Payment Category:</strong> ${paymentLabel}</p>
       <p><strong>Fee Paid:</strong> Rs. ${appointment.consultation_fee}</p>
       <p><strong>Aadhaar No:</strong> ${appointment.aadhaar_no || "N/A"}</p>
       <p><strong>ID Document:</strong> ${appointment.id_document_url ? `<a href="${appointment.id_document_url}">View ID Document</a>` : "N/A"}</p>
       <p><strong>Razorpay Payment ID:</strong> ${appointment.razorpay_payment_id}</p>
       <p><strong>Message:</strong> ${appointment.message}</p>`,
    );

    res.status(201).json({ message: "Appointment booked successfully", appointment });
  } catch (error: any) {
    console.error("Booking error:", error);
    res.status(500).json({ message: error.message || "Failed to book appointment" });
  }
}

export async function getFullDates(req: Request, res: Response) {
  try {
    const maxSetting = await prisma.setting.findUnique({ where: { key: "max_appointments_per_day" } });
    const maxAppointments = maxSetting ? parseInt(maxSetting.value, 10) : 50;

    const appointmentCounts = await prisma.appointment.groupBy({
      by: ["preferred_date"],
      _count: {
        id: true,
      },
      where: {
        preferred_date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const fullDates = appointmentCounts
      .filter((group) => group._count.id >= maxAppointments)
      .map((group) => group.preferred_date.toISOString().split("T")[0]);

    res.json({ full_dates: fullDates });
  } catch (error: any) {
    console.error("Get full dates error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch full dates" });
  }
}
