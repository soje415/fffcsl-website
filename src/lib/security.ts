import { checkRateLimit } from "@/lib/db";

/** ID card fee, enforced server-side. The client's copy is display-only. */
export const ID_CARD_FEE_KOBO = 250_000;
export const ID_CARD_FEE_NAIRA = ID_CARD_FEE_KOBO / 100;

/** Tokens issued by pre-registration today: FFFCSL/<year>/<9 digits>. */
export const NEW_MEMBER_ID_RE = /^FFFCSL\/\d{4}\/\d{9}$/;
/** Also matches legacy IDs already in the database (FFFCSL/TA/317394, FFFCSL/2026/482913). */
export const MEMBER_ID_RE = /^FFFCSL\/[A-Za-z0-9]{2,4}\/\d{3,9}$/;

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function fail(status: number, error: string, headers?: Record<string, string>) {
  return Response.json({ success: false, error }, { status, headers });
}

/** Returns a 429 response when `key` is over its limit, otherwise null. Counts this hit. */
export async function rateLimit(
  name: string,
  subject: string,
  max: number,
  windowSeconds: number
): Promise<Response | null> {
  const ok = await checkRateLimit(`${name}:${subject}`, max, windowSeconds);
  return ok
    ? null
    : fail(429, "Too many requests. Please wait a while and try again.", {
        "Retry-After": String(windowSeconds),
      });
}

/**
 * Blocks browser requests that originate from another site. Non-browser
 * clients send no Origin header and pass through — they can't ride a
 * victim's session, which is what this guards against.
 */
export function crossOriginBlocked(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    // fall through to the block
  }
  return fail(403, "Cross-origin request blocked.");
}

/** Reads a JSON object body, refusing anything over `maxBytes`. */
export async function readJson(
  req: Request,
  maxBytes: number
): Promise<{ data: Record<string, unknown>; error?: undefined } | { data?: undefined; error: Response }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { error: fail(413, "Request is too large.") };

  const text = await req.text();
  if (text.length > maxBytes) return { error: fail(413, "Request is too large.") };

  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { data: parsed as Record<string, unknown> };
    }
  } catch {
    // fall through
  }
  return { error: fail(400, "Invalid request body.") };
}

/** Logs the real error server-side and returns a generic message, so DB/driver details never reach clients. */
export function serverError(scope: string, err: unknown, publicMessage = "Something went wrong. Please try again.") {
  console.error(`[${scope}]`, err instanceof Error ? err.message : "unknown error");
  return fail(500, publicMessage);
}

export function badRequest(message: string) {
  return fail(400, message);
}

export function notFound(message: string) {
  return fail(404, message);
}

type ProviderError = Error & { code?: string; status?: number };

/** Provider (Hyparrow) failures: pass through 4xx validation text, hide anything else. */
export function providerError(scope: string, err: unknown) {
  const e = err as ProviderError;
  if (e?.status && e.status >= 400 && e.status < 500 && e.message) {
    return Response.json(
      { success: false, code: e.code ?? "REQUEST_REJECTED", error: e.message },
      { status: e.status }
    );
  }
  return serverError(scope, err, "The payment service is unavailable right now. Please try again shortly.");
}
