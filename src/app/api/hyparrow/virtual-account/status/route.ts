import { checkVirtualAccountPaid, type HyparrowError } from "@/lib/providers/hyparrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(err: unknown) {
  const e = err as HyparrowError;
  const status = e.status ?? 500;
  return Response.json(
    {
      success: false,
      code: e.code ?? "INTERNAL_ERROR",
      error: e.message ?? "Unexpected payment error",
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { customerId?: string; amountKobo?: number };
    if (!body.customerId || typeof body.amountKobo !== "number") {
      return Response.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "customerId and amountKobo are required.",
        },
        { status: 400 }
      );
    }

    const paid = await checkVirtualAccountPaid(body.customerId, body.amountKobo);
    return Response.json({ success: true, paid });
  } catch (err) {
    return errorResponse(err);
  }
}
