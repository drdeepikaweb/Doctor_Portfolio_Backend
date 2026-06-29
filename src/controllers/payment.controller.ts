import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { notifyClinic } from "../services/notification.service.js";
import { formatConsultationTelegramMessage } from "../services/telegram.service.js";

const paymentLabels: Record<string, string> = {
  iitr_student: "IITR Students",
  iitr_faculty_staff: "IITR Faculty/Staff",
  iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
  others: "All Others",
};

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { id } = req.body;

    if (!id) {
      res.status(400).json({ message: "Consultation ID is required" });
      return;
    }

    // Fetch consultation details
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      res.status(404).json({ message: "Consultation not found" });
      return;
    }

    // If already verified, return success directly
    if (consultation.payment_verified) {
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        consultation,
      });
      return;
    }

    const clientId = env.phonepe.clientId;
    const clientSecret = env.phonepe.clientSecret;
    const clientVersion = env.phonepe.clientVersion;
    const oauthUrl = env.phonepe.oauthUrl;
    const statusUrl = env.phonepe.statusUrl;

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
      res.status(502).json({ success: false, message: "Payment status check failed (OAuth authentication failure)." });
      return;
    }

    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("No access token in PhonePe OAuth response:", tokenData);
      res.status(502).json({ success: false, message: "Payment status check failed (OAuth token missing)." });
      return;
    }

    // Call PhonePe V2 Order Status check API
    // GET {statusUrl}/{merchantOrderId}/status
    console.log(`Checking PhonePe V2 transaction status for transaction: ${consultation.id}`);

    const phonepeResponse = await fetch(
      `${statusUrl}/${consultation.id}/status`,
      {
        method: "GET",
        headers: {
          "Authorization": `O-Bearer ${accessToken}`,
        },
      }
    );

    if (!phonepeResponse.ok) {
      const errorText = await phonepeResponse.text();
      console.error("PhonePe V2 status check failed response:", errorText);
      res.status(502).json({ success: false, message: "Payment status check failed. Please check back later." });
      return;
    }

    const phonepeData = (await phonepeResponse.json()) as any;
    console.log("PhonePe V2 status response:", phonepeData);

    const state = phonepeData.state || phonepeData.data?.state;
    const isSuccess = state === "COMPLETED" || phonepeData.code === "PAYMENT_SUCCESS" || phonepeData.success === true;
    const isPending = state === "PENDING" || state === "INITIATED" || phonepeData.code === "PAYMENT_PENDING";

    if (isSuccess) {
      const providerReferenceId = 
        phonepeData.paymentDetails?.[0]?.transactionId || 
        phonepeData.orderId || 
        phonepeData.data?.transactionId || 
        phonepeData.data?.providerReferenceId || 
        "PhonePeRef";

      // Update consultation payment status in database
      const updatedConsultation = await prisma.consultation.update({
        where: { id },
        data: {
          payment_verified: true,
          phonepe_transaction_id: providerReferenceId,
        },
      });

      // Send notifications to clinic
      const paymentLabel = paymentLabels[updatedConsultation.payment_category || ""] || updatedConsultation.payment_category || "Not selected";
      const documentUrls = updatedConsultation.document_urls;
      const documentText = documentUrls.length ? documentUrls.join(", ") : "Not uploaded";

      await notifyClinic(
        "New online consultation request (Paid)",
        `<h2>Online Consultation</h2>
         <p><strong>Name:</strong> ${updatedConsultation.name}</p>
         <p><strong>Age:</strong> ${updatedConsultation.age}</p>
         <p><strong>Gender:</strong> ${updatedConsultation.gender}</p>
         <p><strong>Phone:</strong> ${updatedConsultation.phone}</p>
         <p><strong>Email:</strong> ${updatedConsultation.email || "Not provided"}</p>
         <p><strong>Address:</strong> ${updatedConsultation.address}</p>
         <p><strong>Preferred Date:</strong> ${updatedConsultation.preferred_date ? updatedConsultation.preferred_date.toDateString() : "N/A"}</p>
         <p><strong>Preferred Time Slot:</strong> ${updatedConsultation.preferred_time || "N/A"}</p>
         <p><strong>Submission ID:</strong> ${updatedConsultation.submission_id || "N/A"}</p>
         <p><strong>Reconsultation:</strong> No (Paid)</p>
         <p><strong>Payment:</strong> ${paymentLabel} - Rs. ${updatedConsultation.consultation_fee}</p>
         <p><strong>Aadhaar No:</strong> ${updatedConsultation.aadhaar_no || "N/A"}</p>
         <p><strong>ID Document:</strong> ${updatedConsultation.id_document_url ? `<a href="${updatedConsultation.id_document_url}">View ID Document</a>` : "N/A"}</p>
         <p><strong>PhonePe Transaction ID:</strong> ${updatedConsultation.phonepe_transaction_id || "N/A"}</p>
         <p><strong>Medical Documents:</strong> ${documentText}</p>`,
        formatConsultationTelegramMessage(updatedConsultation),
      );

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        consultation: updatedConsultation,
      });
    } else if (isPending) {
      res.status(200).json({
        success: false,
        pending: true,
        message: "Payment is pending verification",
      });
    } else {
      res.status(200).json({
        success: false,
        message: phonepeData.message || "Payment failed or was cancelled by user",
      });
    }
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: error.message || "Internal server error during verification" });
  }
}
