import { verifyIdentity, type HyparrowError } from "@/lib/providers/hyparrow";
import { checkRateLimit, hasConfirmedPayment } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Each BVN/NIN lookup costs money, so payment is required before this ever
// calls the provider, and a paid member is still capped so one payment can't
// be used to probe an unbounded number of identifiers.
const VERIFY_RATE_LIMIT = 5;
const VERIFY_RATE_WINDOW_SECONDS = 24 * 60 * 60;

function errorResponse(err: unknown) {
  const e = err as HyparrowError;
  const status = e.status ?? 500;
  return Response.json(
    {
      success: false,
      code: e.code ?? "INTERNAL_ERROR",
      error: e.message ?? "Unexpected verification error",
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      type?: string;
      identifier?: string;
      memberId?: string;
    };

    const type = body.type;
    const identifier = String(body.identifier ?? "").replace(/\D/g, "");
    const memberId = String(body.memberId ?? "").trim();

    if ((type !== "bvn" && type !== "nin") || !/^\d{11}$/.test(identifier)) {
      return Response.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Select BVN or NIN and enter a valid 11-digit number.",
        },
        { status: 400 }
      );
    }

    if (!memberId) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "A member token is required." },
        { status: 400 }
      );
    }

    const paid = await hasConfirmedPayment(memberId);
    if (!paid) {
      return Response.json(
        {
          success: false,
          code: "PAYMENT_REQUIRED",
          error: "Payment must be confirmed before identity verification.",
        },
        { status: 402 }
      );
    }

    const withinLimit = await checkRateLimit(
      `verify:${memberId}`,
      VERIFY_RATE_LIMIT,
      VERIFY_RATE_WINDOW_SECONDS
    );
    if (!withinLimit) {
      return Response.json(
        {
          success: false,
          code: "RATE_LIMITED",
          error: "Too many verification attempts on this token. Please contact support.",
        },
        { status: 429 }
      );
    }

    const outcome = await verifyIdentity({ type, identifier });

    return Response.json({ success: true, ...outcome });
  } catch (err) {
    const e = err as HyparrowError;
    if (e.code === "RECORD_NOT_FOUND") {
      return Response.json({
        success: true,
        status: "not_found",
        reason: "No record was found for that number. Check the number and try again.",
      });
    }
    return errorResponse(err);
  }
}
