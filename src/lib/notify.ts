import { after } from "next/server";
import { checkRateLimit } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-mode";
import { sendSms } from "@/lib/providers/termii";
import { completeMessage, gsmSafe, paymentMessage, registeredMessage, type Lang } from "@/lib/sms-templates";

export type { Lang };

export function parseLang(value: unknown): Lang {
  return value === "ha" ? "ha" : "en";
}

/**
 * SMS is only ever sent from here, with fixed templates and no caller-supplied
 * text, so it can't be abused as a relay. Each phone is capped per template
 * per day, failures never surface to the user, and it runs after the response.
 */
function queue(kind: string, phone: string, message: string) {
  if (isDemoMode() || !phone) return;
  after(async () => {
    try {
      if (!(await checkRateLimit(`sms:${kind}:${phone}`, 5, 24 * 60 * 60))) return;
      await sendSms(phone, gsmSafe(message));
    } catch (err) {
      console.error(`[sms:${kind}] not sent`, err instanceof Error ? err.message : "error");
    }
  });
}

export function smsRegistered(phone: string, memberId: string, lang: Lang) {
  queue("registered", phone, registeredMessage(memberId, lang));
}

export function smsPaymentReceived(phone: string, lang: Lang) {
  queue("payment", phone, paymentMessage(lang));
}

export function smsRegistrationComplete(phone: string, firstName: string, memberId: string, lang: Lang) {
  queue("complete", phone, completeMessage(firstName, memberId, lang));
}
