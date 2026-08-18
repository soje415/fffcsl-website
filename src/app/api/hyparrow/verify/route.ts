import { verifyIdentity, type HyparrowError } from "@/lib/providers/hyparrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      firstName?: string;
      lastName?: string;
    };

    const type = body.type;
    const identifier = String(body.identifier ?? "").replace(/\D/g, "");

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

    const outcome = await verifyIdentity({
      type,
      identifier,
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
    });

    return Response.json({ success: true, ...outcome });
  } catch (err) {
    const e = err as HyparrowError;
    if (e.code === "RECORD_NOT_FOUND") {
      return Response.json({
        success: true,
        status: "mismatch",
        reason: "No record was found for that number. Check the number and try again.",
      });
    }
    return errorResponse(err);
  }
}
