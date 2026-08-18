function config() {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;
  const baseUrl = process.env.TERMII_BASE_URL;
  if (!apiKey || !senderId || !baseUrl) {
    throw new Error(
      "Termii is not configured (set TERMII_API_KEY, TERMII_SENDER_ID and TERMII_BASE_URL)."
    );
  }
  return { apiKey, senderId, baseUrl };
}

/**
 * Normalize a Nigerian phone number to Termii's expected international format
 * (no leading +, e.g. 2348012345678). Accepts 080..., 070..., +234..., 234...
 */
export function toInternational(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  else if (digits.length === 10) digits = `234${digits}`;
  return digits;
}

export async function sendOtp(phone: string): Promise<string> {
  const { apiKey, senderId, baseUrl } = config();
  const res = await fetch(`${baseUrl}/api/sms/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      message_type: "NUMERIC",
      to: toInternational(phone),
      from: senderId,
      channel: process.env.TERMII_CHANNEL ?? "generic",
      pin_attempts: Number(process.env.TERMII_PIN_ATTEMPTS ?? 3),
      pin_time_to_live: Number(process.env.TERMII_PIN_TTL_MINUTES ?? 10),
      pin_length: Number(process.env.TERMII_PIN_LENGTH ?? 6),
      pin_placeholder: "< 1234 >",
      message_text:
        "Your FFFCSL verification code is < 1234 >. Do not share it with anyone.",
      pin_type: "NUMERIC",
    }),
  });

  const payload = (await res.json()) as {
    pinId?: string;
    pin_id?: string;
    message?: string;
  };

  if (!res.ok || !payload.pinId) {
    const msg = payload.message ?? `Termii send failed (${res.status})`;
    throw new Error(msg);
  }

  return payload.pinId;
}

export async function verifyOtp(pinId: string, pin: string): Promise<boolean> {
  const { apiKey, baseUrl } = config();
  const res = await fetch(`${baseUrl}/api/sms/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, pin_id: pinId, pin }),
  });

  const payload = (await res.json()) as {
    verified?: string | boolean;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(payload.message ?? `Termii verify failed (${res.status})`);
  }

  return payload.verified === true || String(payload.verified).toLowerCase() === "true";
}
