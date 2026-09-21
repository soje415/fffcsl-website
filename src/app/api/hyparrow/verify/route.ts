import { verifyIdentity, type HyparrowError } from "@/lib/providers/hyparrow";
import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import { normalizeDob, normalizeGender } from "@/lib/kyc-autofill";
import { parseLang, smsRegistrationComplete } from "@/lib/notify";
import {
  MEMBER_ID_RE,
  badRequest,
  clientIp,
  crossOriginBlocked,
  notFound,
  providerError,
  rateLimit,
  readJson,
  serverError,
} from "@/lib/security";
import { PhotoError, parsePhotoDataUrl, uploadPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Each BVN/NIN lookup costs money, so payment is required before this ever
// calls the provider, and a paid member is still capped so one payment can't
// be used to probe an unbounded number of identifiers.
const VERIFY_RATE_LIMIT = 5;
const VERIFY_RATE_WINDOW_SECONDS = 24 * 60 * 60;

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const clean = (v?: string) => (v ?? "").replace(CONTROL_CHARS, " ").trim().slice(0, 100);

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  try {
    const body = await readJson(req, 2048);
    if (body.error) return body.error;

    const type = body.data.type;
    const identifier = String(body.data.identifier ?? "").replace(/\D/g, "");
    const memberId = String(body.data.memberId ?? "").trim();

    if ((type !== "bvn" && type !== "nin") || !/^\d{11}$/.test(identifier)) {
      return badRequest("Select BVN or NIN and enter a valid 11-digit number.");
    }
    if (!MEMBER_ID_RE.test(memberId)) return badRequest("A member token is required.");

    const ipLimited = await rateLimit("verify-ip", clientIp(req), 30, 3600);
    if (ipLimited) return ipLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT first_name, phone, nin, bvn, verification_status FROM farmers WHERE member_id = ${memberId}
    `;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as {
      first_name: string;
      phone: string;
      nin: string;
      bvn: string;
      verification_status: string;
    };

    if (!(await hasConfirmedPayment(memberId))) {
      return Response.json(
        { success: false, code: "PAYMENT_REQUIRED", error: "Payment must be confirmed before identity verification." },
        { status: 402 }
      );
    }

    // Already done: don't pay for a second lookup.
    if (farmer.verification_status === "verified") {
      return Response.json({ success: true, status: "verified" });
    }

    // The number checked must be the one registered with, so a paid token
    // can't be used to look up somebody else's identity record.
    const registered = type === "nin" ? farmer.nin : farmer.bvn;
    if (registered && registered !== identifier) {
      return Response.json(
        {
          success: false,
          code: "IDENTIFIER_MISMATCH",
          error: `That doesn't match the ${type.toUpperCase()} you registered with. Check the number and try again.`,
        },
        { status: 400 }
      );
    }

    // One person, one membership.
    const duplicate =
      type === "nin"
        ? await db`SELECT 1 FROM farmers WHERE nin = ${identifier} AND member_id <> ${memberId} AND verification_status = 'verified' LIMIT 1`
        : await db`SELECT 1 FROM farmers WHERE bvn = ${identifier} AND member_id <> ${memberId} AND verification_status = 'verified' LIMIT 1`;
    if (duplicate.length > 0) {
      return Response.json(
        {
          success: false,
          code: "ALREADY_REGISTERED",
          error: `This ${type.toUpperCase()} is already registered to a member. Contact support if this is a mistake.`,
        },
        { status: 409 }
      );
    }

    const memberLimited = await rateLimit("verify", memberId, VERIFY_RATE_LIMIT, VERIFY_RATE_WINDOW_SECONDS);
    if (memberLimited) {
      return Response.json(
        {
          success: false,
          code: "RATE_LIMITED",
          error: "Too many verification attempts on this token. Please contact support.",
        },
        { status: 429 }
      );
    }

    let outcome;
    try {
      outcome = await verifyIdentity({ type, identifier });
    } catch (err) {
      if ((err as HyparrowError).code === "RECORD_NOT_FOUND") {
        return Response.json({
          success: true,
          status: "not_found",
          reason: "No record was found for that number. Check the number and try again.",
        });
      }
      throw err;
    }

    if (outcome.status !== "verified" || !outcome.record) {
      return Response.json({ success: true, ...outcome });
    }

    // The registry record is authoritative: it replaces whatever was typed at
    // registration, and the server (not the browser) marks the member verified.
    const rec = outcome.record;
    let photoKey = "";
    if (rec.photo?.startsWith("data:")) {
      const own = await db`SELECT photo FROM farmers WHERE member_id = ${memberId}`;
      if (!(own[0] as { photo: string } | undefined)?.photo) {
        try {
          photoKey = await uploadPhoto(memberId, parsePhotoDataUrl(rec.photo));
        } catch (err) {
          // Registry photos are often JPEG2000; if we can't store it safely, skip it.
          if (!(err instanceof PhotoError)) console.error("[kyc] photo not stored", err instanceof Error ? err.message : "error");
        }
      }
    }

    await db`
      UPDATE farmers SET
        verification_status = 'verified',
        verified_at = COALESCE(verified_at, now()),
        kyc_type = ${type},
        nin = CASE WHEN ${type}::text = 'nin' THEN ${identifier} ELSE nin END,
        bvn = CASE WHEN ${type}::text = 'bvn' THEN ${identifier} ELSE bvn END,
        first_name = COALESCE(NULLIF(${clean(rec.firstName)}, ''), first_name),
        last_name = COALESCE(NULLIF(${clean(rec.lastName)}, ''), last_name),
        other_names = COALESCE(NULLIF(${clean(rec.middleName)}, ''), other_names),
        dob = COALESCE(NULLIF(${normalizeDob(rec.dateOfBirth)}, ''), dob),
        gender = COALESCE(NULLIF(${normalizeGender(rec.gender)}, ''), gender),
        photo = COALESCE(NULLIF(${photoKey}, ''), photo)
      WHERE member_id = ${memberId}
    `;

    smsRegistrationComplete(
      farmer.phone,
      clean(rec.firstName) || farmer.first_name,
      memberId,
      parseLang(body.data.lang)
    );

    return Response.json({ success: true, ...outcome });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("kyc", err);
    return serverError("kyc", err, "Verification failed. Please try again.");
  }
}
