import { createVirtualAccount, type HyparrowError } from "@/lib/providers/hyparrow";

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

    return Response.json({ success: true, account });
  } catch (err) {
    return errorResponse(err);
  }
}
