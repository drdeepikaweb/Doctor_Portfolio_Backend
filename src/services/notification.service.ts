import { sendTelegramMessage } from "./telegram.service.js";

export async function notifyClinic(subject: string, html: string, message: string) {
  const results = await Promise.allSettled([
    sendTelegramMessage(message),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Clinic notification failed:", result.reason);
    }
  }
}
