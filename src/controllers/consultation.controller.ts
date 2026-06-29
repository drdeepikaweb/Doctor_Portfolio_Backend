import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { uploadBuffer } from "../services/r2.service.js";
import { notifyClinic } from "../services/notification.service.js";
import { formatConsultationTelegramMessage } from "../services/telegram.service.js";
import { getNextSubmissionId } from "../utils/submission.js";

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
      payment_category,
      consultation_fee,
      aadhaar_no,
      preferred_date,
      preferred_time,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      reconsultation_id,
    } = req.body;

    // Verify slot capacity dynamically
    const selectedDate = new Date(preferred_date);
    selectedDate.setHours(0, 0, 0, 0);

    const capacitySetting = await prisma.setting.findUnique({ where: { key: "patients_per_slot" } });
    const capacity = capacitySetting ? Number(capacitySetting.value) : 5;

    const count = await prisma.consultation.count({
      where: {
        preferred_date: selectedDate,
        preferred_time: preferred_time,
      },
    });

    if (count >= capacity) {
      res.status(400).json({ message: "This time slot is fully booked. Please choose another slot." });
      return;
    }

    // Extract files from fields
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const documentFiles = filesObj?.documents || [];
    const idFile = filesObj?.id_document?.[0];

    // Upload general health documents
    const documentUrls: string[] = [];
    for (const file of documentFiles) {
      const upload = await uploadBuffer(file);
      documentUrls.push(upload.secure_url);
    }

    let is_reconsultation = false;
    let final_submission_id = "";
    let final_consultation_fee = 0;
    let final_payment_category = payment_category || null;
    let id_document_url = null;

    if (reconsultation_id && reconsultation_id.trim() !== "") {
      // UHID within a week verification
      const original = await prisma.consultation.findFirst({
        where: {
          submission_id: reconsultation_id.trim(),
        },
      });

      if (!original) {
        res.status(400).json({ message: "Invalid UHID. Original consultation not found." });
        return;
      }

      const diffTime = Math.abs(new Date().getTime() - original.created_at.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        res.status(400).json({ message: "This UHID is older than 7 days. Follow-up consultation is only free within 7 days." });
        return;
      }

      is_reconsultation = true;
      final_submission_id = original.submission_id!;
      final_consultation_fee = 0;
      const origIdDoc = original.id_document_url;
      id_document_url = origIdDoc && origIdDoc.includes("localhost:5000/uploads") ? null : origIdDoc;
    } else {
      // Conditional requirement checks
      const discountCategories = ["iitr_student"];
      if (discountCategories.includes(payment_category)) {
        if (!idFile) {
          res.status(400).json({ message: "Student ID document upload is required for student category" });
          return;
        }
        const upload = await uploadBuffer(idFile);
        id_document_url = upload.secure_url;
      }

      final_consultation_fee = Number(consultation_fee);

      // Generate next sequential unique ID
      const lastConsultation = await prisma.consultation.findFirst({
        where: {
          submission_id: {
            not: null,
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      final_submission_id = getNextSubmissionId(lastConsultation?.submission_id);
    }

    const consultation = await prisma.consultation.create({
      data: {
        name,
        age: Number(age),
        gender,
        phone,
        email: email || null,
        address,
        preferred_date: selectedDate,
        preferred_time,
        document_url: documentUrls[0] || null,
        document_urls: documentUrls,
        payment_category: final_payment_category,
        consultation_fee: final_consultation_fee,
        aadhaar_no: aadhaar_no || null,
        id_document_url,
        submission_id: final_submission_id,
        is_reconsultation,
        payment_verified: is_reconsultation,
      },
    });

    if (is_reconsultation) {
      const paymentLabel = paymentLabels[final_payment_category || ""] || final_payment_category || "Not selected";
      const documentText = documentUrls.length ? documentUrls.join(", ") : "Not uploaded";

      await notifyClinic(
        "New online consultation request (Free Reconsultation)",
        `<h2>Online Consultation</h2>
         <p><strong>Name:</strong> ${consultation.name}</p>
         <p><strong>Age:</strong> ${consultation.age}</p>
         <p><strong>Gender:</strong> ${consultation.gender}</p>
         <p><strong>Phone:</strong> ${consultation.phone}</p>
         <p><strong>Email:</strong> ${consultation.email || "Not provided"}</p>
         <p><strong>Address:</strong> ${consultation.address}</p>
         <p><strong>Preferred Date:</strong> ${consultation.preferred_date ? consultation.preferred_date.toDateString() : "N/A"}</p>
         <p><strong>Preferred Time Slot:</strong> ${consultation.preferred_time || "N/A"}</p>
         <p><strong>Submission ID:</strong> ${consultation.submission_id || "N/A"}</p>
         <p><strong>Reconsultation:</strong> Yes (Free)</p>
         <p><strong>Payment:</strong> Free - Rs. 0</p>
         <p><strong>Aadhaar No:</strong> ${consultation.aadhaar_no || "N/A"}</p>
         <p><strong>ID Document:</strong> ${consultation.id_document_url ? `<a href="${consultation.id_document_url}">View ID Document</a>` : "N/A"}</p>
         <p><strong>Medical Documents:</strong> ${documentText}</p>`,
        formatConsultationTelegramMessage(consultation),
      );

      res.status(201).json({ message: "Consultation created successfully", consultation });
      return;
    }

    // Paid consultation - initiate PhonePe redirect payment
    const amountInPaise = final_consultation_fee * 100;
    const clientId = env.phonepe.clientId;
    const clientSecret = env.phonepe.clientSecret;
    const clientVersion = env.phonepe.clientVersion;
    const oauthUrl = env.phonepe.oauthUrl;
    const checkoutUrl = env.phonepe.checkoutUrl;

    console.log(`Fetching PhonePe OAuth token for client: ${clientId}`);

    // Fetch Access Token
    const tokenParams = new URLSearchParams();
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("client_version", clientVersion);
    tokenParams.append("grant_type", "client_credentials");

    const tokenResponse = await fetch(oauthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("PhonePe OAuth token fetching failed response:", errorText);
      res.status(502).json({ message: "Failed to authenticate with PhonePe payment gateway. Please try again." });
      return;
    }

    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("No access token in PhonePe OAuth response:", tokenData);
      res.status(502).json({ message: "Failed to authenticate with PhonePe payment gateway." });
      return;
    }

    // Create V2 checkout pay request
    const payPayload = {
      merchantOrderId: consultation.id,
      amount: amountInPaise,
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Consultation Fee Payment",
        merchantUrls: {
          redirectUrl: `${env.frontendUrl}/online-consultation/payment-callback?id=${consultation.id}`
        }
      }
    };

    console.log(`Initiating PhonePe V2 payment for consultation ${consultation.id}, amount: ${amountInPaise} paise`);

    const phonepeResponse = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(payPayload),
    });

    if (!phonepeResponse.ok) {
      const errorText = await phonepeResponse.text();
      console.error("PhonePe V2 payment initiation failed response:", errorText);
      res.status(502).json({ message: "Payment gateway checkout failed. Please try again." });
      return;
    }

    const phonepeData = (await phonepeResponse.json()) as any;
    console.log("PhonePe V2 checkout response:", phonepeData);

    const redirectUrl = phonepeData.redirectUrl || phonepeData.data?.redirectUrl || phonepeData.data?.instrumentResponse?.redirectInfo?.url;

    if (redirectUrl) {
      res.status(201).json({
        message: "Redirecting to payment gateway",
        redirectUrl,
        consultation,
      });
    } else {
      console.error("PhonePe V2 checkout URL not found in payload:", phonepeData);
      res.status(502).json({ message: phonepeData.message || "Failed to generate checkout link from payment gateway" });
    }
  } catch (error: any) {
    console.error("Consultation error:", error);
    res.status(500).json({ message: error.message || "Failed to create consultation" });
  }
}
