import { ID_CARD_FEE_NAIRA } from "@/lib/security";

export type Lang = "en" | "ha";

export const SITE_URL = (process.env.SITE_URL ?? "https://fadamacooperative.com").replace(/\/+$/, "");

// Hausa hooked letters have no GSM-7 equivalent; sending them switches the
// whole message to unicode (70 chars per part instead of 160) and can garble
// on older handsets, so SMS text uses their plain forms.
const PLAIN: Record<string, string> = { ɓ: "b", ɗ: "d", ƙ: "k", ƴ: "y", Ɓ: "B", Ɗ: "D", Ƙ: "K", Ƴ: "Y", "’": "'", "‘": "'", "–": "-", "—": "-" };

/** Reduces text to plain ASCII so it always goes out as a cheap single-encoding SMS. */
export function gsmSafe(text: string): string {
  return text
    .replace(/[ɓɗƙƴƁƊƘƳ’‘–—]/g, (c) => PLAIN[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

/** Slashes are legal in a query string, and the ID is validated to A-Z/digits/slash, so no encoding is needed. */
export function continueLink(memberId: string): string {
  return `${SITE_URL}/membership/id-card?token=${memberId}`;
}

export function registeredMessage(memberId: string, lang: Lang): string {
  const link = continueLink(memberId);
  return gsmSafe(
    lang === "ha"
      ? `FFFCSL: An karbi rajistarka. Samu katin shaidarka: ${link} Lamba: ${memberId}`
      : `FFFCSL: Registration received. Get your ID card: ${link} Token: ${memberId}`
  );
}

export function paymentMessage(lang: Lang): string {
  const fee = ID_CARD_FEE_NAIRA.toLocaleString("en-NG");
  return gsmSafe(
    lang === "ha"
      ? `An karbi biyan kudi! An tabbatar da kudin katin shaida na N${fee} na FFFCSL. Na gode.`
      : `Payment received! Your N${fee} FFFCSL ID card fee is confirmed. Thank you.`
  );
}

export function completeMessage(firstName: string, memberId: string, lang: Lang): string {
  return gsmSafe(
    lang === "ha"
      ? `Barka ${firstName}, rajistar FFFCSL dinka ta cika. ID na memba: ${memberId}. Ka kiyaye wannan ID.`
      : `Congratulations ${firstName}, your FFFCSL registration is complete. Member ID: ${memberId}. Keep this ID safe.`
  );
}
