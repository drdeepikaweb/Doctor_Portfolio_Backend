import { env } from "../config/env.js";

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const paymentLabels: Record<string, string> = {
  iitr_student: "IITR Students",
  iitr_faculty_staff: "IITR Faculty/Staff",
  iitr_retired_faculty_staff: "IITR Retired Faculty/Staff",
  others: "All Others",
};

export function formatConsultationTelegramMessage(consultation: any): string {
  const heading = consultation.is_reconsultation
    ? "<b>🩺 NEW RECONSULTATION REQUEST (FREE)</b>"
    : "<b>🩺 NEW ONLINE CONSULTATION REQUEST (PAID)</b>";

  const name = escapeHtml(consultation.name);
  const uhid = escapeHtml(consultation.submission_id || "N/A");
  const age = consultation.age;
  const gender = escapeHtml(consultation.gender);
  const phone = escapeHtml(consultation.phone);
  const email = escapeHtml(consultation.email || "Not provided");
  const address = escapeHtml(consultation.address);
  const preferredDate = consultation.preferred_date 
    ? new Date(consultation.preferred_date).toLocaleDateString("en-IN", { dateStyle: "medium" }) 
    : "N/A";
  const preferredTime = escapeHtml(consultation.preferred_time || "N/A");
  
  const categoryLabel = paymentLabels[consultation.payment_category || ""] || consultation.payment_category || "Free Reconsultation";
  const category = escapeHtml(categoryLabel);

  const paymentStatus = consultation.is_reconsultation
    ? "Free (Follow-up)"
    : consultation.payment_verified
      ? `Paid (Rs. ${consultation.consultation_fee})`
      : `Pending Payment (Rs. ${consultation.consultation_fee})`;

  // Uploaded documents formatting
  let documents = "None uploaded";
  if (consultation.document_urls && consultation.document_urls.length > 0) {
    documents = consultation.document_urls
      .map((url: string, index: number) => `• <a href="${url}">Medical Document ${index + 1}</a>`)
      .join("\n");
  } else if (consultation.document_url) {
    documents = `• <a href="${consultation.document_url}">Medical Document 1</a>`;
  }

  // ID Document link (if IITR Student)
  let idDocLine = "";
  if (consultation.payment_category === "iitr_student") {
    if (consultation.id_document_url) {
      idDocLine = `\n🪪 <b>ID Document:</b> <a href="${consultation.id_document_url}">View Student ID Card</a>\n`;
    } else {
      idDocLine = `\n🪪 <b>ID Document:</b> Not uploaded\n`;
    }
  }

  return `${heading}

👤 <b>Patient Details:</b>
• <b>UHID:</b> <code>${uhid}</code>
• <b>Full Name:</b> ${name}
• <b>Age:</b> ${age}
• <b>Gender:</b> ${gender}
• <b>Phone Number:</b> ${phone}
• <b>Email:</b> ${email}
• <b>Address:</b> ${address}

📅 <b>Appointment Details:</b>
• <b>Preferred Date:</b> ${preferredDate}
• <b>Preferred Time:</b> ${preferredTime}

💳 <b>Payment & Category:</b>
• <b>Category:</b> ${category}
• <b>Payment Status:</b> ${paymentStatus}
${idDocLine}
📂 <b>Uploaded Medical Documents:</b>
${documents}
`;
}

export async function sendTelegramMessage(text: string) {
  const { botToken, chatId } = env.telegram;
  if (!botToken || !chatId) {
    console.warn("Telegram bot token or chat ID not configured. Skipping notification.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  console.log(`Sending Telegram notification to chat: ${chatId}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Telegram notification failed");
    throw new Error(errorText);
  }
}
