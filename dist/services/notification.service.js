import { sendClinicWhatsapp } from "./whatsapp.service.js";
export async function notifyClinic(subject, html, whatsappMessage) {
    const results = await Promise.allSettled([
        sendClinicWhatsapp(whatsappMessage),
    ]);
    for (const result of results) {
        if (result.status === "rejected") {
            console.error("Clinic notification failed:", result.reason);
        }
    }
}
