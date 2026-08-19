import { getCheckoutStatus, type HyparrowError } from "@/lib/providers/hyparrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(err: unknown) {
  const e = err as HyparrowError;
  const status = e.status ?? 500;
  return Response.json(
    {
      success: false,
      code: e.code ?? "INTERNAL_ERROR",
      error: e.message ?? "Unexpected checkout error",
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { invoiceId?: string };
    if (!body.invoiceId) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "invoiceId is required." },
        { status: 400 }
      );
    }

    const paid = await getCheckoutStatus(body.invoiceId);
    return Response.json({ success: true, paid });
  } catch (err) {
    return errorResponse(err);
  }
}
