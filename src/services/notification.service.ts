import { sendClinicEmail } from "./email.service.js";
import { sendClinicWhatsapp } from "./whatsapp.service.js";

export async function notifyClinic(subject: string, html: string, whatsappMessage: string) {
  const results = await Promise.allSettled([
    sendClinicEmail(subject, html),
    sendClinicWhatsapp(whatsappMessage),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Clinic notification failed:", result.reason);
    }
  }
}
