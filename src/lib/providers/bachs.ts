const DEFAULT_BASE_URL = "https://api.bachs.io";

function config() {
  // Pasted env values often carry a trailing newline or space, which makes the
  // Authorization header invalid; strip it, and never echo the key in an error.
  const apiKey = process.env.BACHS_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) throw new Error("Bachs is not configured (set BACHS_API_KEY).");
  if (!/^[\x21-\x7E]+$/.test(apiKey)) {
    throw new Error("BACHS_API_KEY contains characters that can't be sent; re-enter it without quotes or line breaks.");
  }
  const baseUrl = (process.env.BACHS_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { baseUrl, apiKey };
}

export type BachsError = Error & { code?: string; status?: number };

async function request(path: string, body?: unknown, method: "GET" | "POST" = "POST") {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await res.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const nested = payload?.error as Record<string, unknown> | string | undefined;
    const detail = payload?.detail ?? payload?.errors ?? (typeof nested === "object" ? nested?.details : undefined);
    const message =
      (typeof nested === "object" ? (nested?.message as string | undefined) : nested) ??
      (payload?.message as string | undefined) ??
      (typeof payload?.detail === "string" ? payload.detail : undefined) ??
      `Bachs request failed (${res.status})${detail ? `: ${JSON.stringify(detail)}` : ""}`;
    const err = new Error(message) as BachsError;
    err.status = res.status;
    err.code = (typeof nested === "object" ? (nested?.code as string | undefined) : undefined) ?? (payload?.code as string | undefined);
    throw err;
  }

  return payload ?? {};
}

export type CheckoutSession = { checkoutId: string; checkoutUrl: string };

/**
 * Bachs hosted checkout, restricted to the two naira rails: card and bank
 * transfer (any bank or wallet app can send the transfer). Amounts are decimal
 * strings in naira, not minor units. metadata carries our member id so a
 * webhook can be traced back even without a database row.
 */
export async function createCheckout(input: {
  amountNaira: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  memberId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const body = await request("/v1/checkout-sessions", {
    pricing: { currency: "NGN", amount: input.amountNaira.toFixed(2) },
    customer: {
      email: input.customerEmail,
      name: input.customerName,
      phone_number: input.customerPhone || undefined,
    },
    payment_method_types: ["NGN_CARD", "NGN_BANK_TRANSFER"],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { member_id: input.memberId, purpose: "FFFCSL ID card fee" },
  });

  const checkoutId = body.checkout_id as string | undefined;
  const checkoutUrl = body.checkout_url as string | undefined;
  if (!checkoutId || !checkoutUrl) throw new Error("Bachs did not return a checkout URL.");
  return { checkoutId, checkoutUrl };
}

const PAID_STATUSES = new Set(["complete", "completed", "paid", "succeeded", "success"]);

/** Re-asks Bachs for the session, so a redirect or poll can never mark a payment paid on its own say-so. */
export async function getCheckoutPaid(checkoutId: string): Promise<boolean> {
  const body = await request(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`, undefined, "GET");
  return PAID_STATUSES.has(String(body.status ?? "").toLowerCase());
}
