import { createVirtualAccount, type HyparrowError } from "@/lib/providers/hyparrow";
import { ensureSchema, sql } from "@/lib/db";

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
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      address?: string;
      amount?: number;
    };

    if (!body.firstName || !body.lastName || !body.email || !body.phoneNumber) {
      return Response.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "firstName, lastName, email and phoneNumber are required.",
        },
        { status: 400 }
      );
    }

    const account = await createVirtualAccount({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
    });

    // Persist the pending payment so the webhook can flip it to "paid".
    try {
      await ensureSchema();
      const amountKobo = Math.round(Number(body.amount ?? 0) * 100);
      await sql()`
        INSERT INTO payments (customer_id, amount_kobo, status, account_number, bank_name)
        VALUES (${account.customerId}, ${amountKobo}, 'pending', ${account.accountNumber}, ${account.bankName})
        ON CONFLICT (customer_id) DO UPDATE SET
          account_number = EXCLUDED.account_number,
          bank_name = EXCLUDED.bank_name
      `;
    } catch {
      // Payment record is best-effort; the account itself is already created.
    }

    return Response.json({ success: true, account });
  } catch (err) {
    return errorResponse(err);
  }
}
