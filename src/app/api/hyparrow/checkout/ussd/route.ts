import { generateUssdCode, type HyparrowError } from "@/lib/providers/hyparrow";

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
    const body = (await req.json()) as { invoiceId?: string; bankCode?: string };
    if (!body.invoiceId || !body.bankCode) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "invoiceId and bankCode are required." },
        { status: 400 }
      );
    }

    const { ussdCode } = await generateUssdCode(body.invoiceId, body.bankCode);
    return Response.json({ success: true, ussdCode });
  } catch (err) {
    return errorResponse(err);
  }
}
