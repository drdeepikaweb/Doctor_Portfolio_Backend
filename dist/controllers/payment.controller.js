import crypto from "crypto";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { notifyClinic } from "../services/notification.service.js";
const paymentLabels = {
    iitr_student: "IITR Students",
    iitr_faculty_staff: "IITR Faculty/Staff",
    iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
    others: "All Others",
};
export async function verifyPayment(req, res) {
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
        const merchantId = env.phonepe.merchantId;
        const saltKey = env.phonepe.saltKey;
        const saltIndex = env.phonepe.saltIndex;
        const host = env.phonepe.host;
        // Call PhonePe status check API
        // GET /pg/v1/status/{merchantId}/{transactionId}
        const stringToSign = `/pg/v1/status/${merchantId}/${consultation.id}${saltKey}`;
        const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
        const xVerify = `${sha256}###${saltIndex}`;
        console.log(`Checking PhonePe transaction status for transaction: ${consultation.id}`);
        const phonepeResponse = await fetch(`${host}/pg/v1/status/${merchantId}/${consultation.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                "X-MERCHANT-ID": merchantId,
            },
        });
        if (!phonepeResponse.ok) {
            const errorText = await phonepeResponse.text();
            console.error("PhonePe status check failed response:", errorText);
            res.status(502).json({ success: false, message: "Payment status check failed. Please check back later." });
            return;
        }
        const phonepeData = (await phonepeResponse.json());
        console.log("PhonePe status response:", phonepeData);
        if (phonepeData.success && phonepeData.code === "PAYMENT_SUCCESS") {
            const providerReferenceId = phonepeData.data?.providerReferenceId || "PhonePeRef";
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
            await notifyClinic("New online consultation request (Paid)", `<h2>Online Consultation</h2>
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
         <p><strong>Medical Documents:</strong> ${documentText}</p>`, `New online consultation request\nName: ${updatedConsultation.name}\nAge: ${updatedConsultation.age}\nGender: ${updatedConsultation.gender}\nPhone: ${updatedConsultation.phone}\nPreferred Date: ${updatedConsultation.preferred_date ? updatedConsultation.preferred_date.toDateString() : "N/A"}\nPreferred Time: ${updatedConsultation.preferred_time || "N/A"}\nSubmission ID: ${updatedConsultation.submission_id || "N/A"}\nReconsultation: No\nPayment: ${paymentLabel} - Rs. ${updatedConsultation.consultation_fee}\nAadhaar No: ${updatedConsultation.aadhaar_no || "N/A"}\nID Document: ${updatedConsultation.id_document_url || "N/A"}`);
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                consultation: updatedConsultation,
            });
        }
        else if (phonepeData.code === "PAYMENT_PENDING") {
            res.status(200).json({
                success: false,
                pending: true,
                message: "Payment is pending verification",
            });
        }
        else {
            res.status(200).json({
                success: false,
                message: phonepeData.message || "Payment failed or was cancelled by user",
            });
        }
    }
    catch (error) {
        console.error("Verify payment error:", error);
        res.status(500).json({ message: error.message || "Internal server error during verification" });
    }
}
