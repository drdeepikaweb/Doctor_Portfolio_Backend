import { env } from "../config/env.js";
export async function sendClinicWhatsapp(message) {
    const { accessToken, phoneNumberId, to } = env.whatsapp;
    if (!accessToken || !phoneNumberId || !to)
        return;
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { preview_url: false, body: message },
        }),
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "WhatsApp notification failed");
        throw new Error(errorText);
    }
}
