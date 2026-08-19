import { createInvoice, type HyparrowError } from "@/lib/providers/hyparrow";

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
    const body = (await req.json()) as {
      title?: string;
      amount?: number;
      customerName?: string;
      customerEmail?: string;
    };

    if (!body.amount || body.amount <= 0) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "amount is required." },
        { status: 400 }
      );
    }

    const invoice = await createInvoice({
      title: body.title || "FFFCSL ID Card Fee",
      amountNaira: body.amount,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
    });

    return Response.json({ success: true, invoiceId: invoice.id });
  } catch (err) {
    return errorResponse(err);
  }
}
