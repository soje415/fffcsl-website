import { after } from "next/server";
import { checkRateLimit } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-mode";
import { sendSms } from "@/lib/providers/termii";
import { ID_CARD_FEE_NAIRA } from "@/lib/security";

const SITE_URL = (process.env.SITE_URL ?? "https://fadamacooperative.com").replace(/\/+$/, "");

export type Lang = "en" | "ha";

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
      await sendSms(phone, message);
    } catch (err) {
      console.error(`[sms:${kind}] not sent`, err instanceof Error ? err.message : "error");
    }
  });
}

export function smsRegistered(phone: string, memberId: string, lang: Lang) {
  const link = `${SITE_URL}/membership/id-card?token=${encodeURIComponent(memberId)}`;
  queue(
    "registered",
    phone,
    lang === "ha"
      ? `FFFCSL: An karɓi rajistarka! Ci gaba don samun katin shaidarka: ${link} Lambar shaidarka: ${memberId}`
      : `FFFCSL: Registration received! Continue to get your ID card: ${link} Your token: ${memberId}`
  );
}

export function smsPaymentReceived(phone: string, lang: Lang) {
  const fee = ID_CARD_FEE_NAIRA.toLocaleString("en-NG");
  queue(
    "payment",
    phone,
    lang === "ha"
      ? `An karɓi biyan kuɗi! An tabbatar da kuɗin katin shaida na N${fee} na FFFCSL. Na gode.`
      : `Payment received! Your N${fee} FFFCSL ID card fee is confirmed. Thank you.`
  );
}

export function smsRegistrationComplete(phone: string, firstName: string, memberId: string, lang: Lang) {
  queue(
    "complete",
    phone,
    lang === "ha"
      ? `Barka ${firstName}, rajistar FFFCSL ɗinka ta cika. ID na memba: ${memberId}. Ka kiyaye wannan ID.`
      : `Congratulations ${firstName}, your FFFCSL registration is complete. Member ID: ${memberId}. Keep this ID safe.`
  );
}
