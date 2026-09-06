import { sendSms, toInternational } from "@/lib/providers/termii";
import { isDemoMode } from "@/lib/demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string; message?: string };
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (toInternational(phone).length < 11) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "Enter a valid phone number." },
        { status: 400 }
      );
    }
    if (!message) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "Message is required." },
        { status: 400 }
      );
    }

    if (!isDemoMode()) {
      await sendSms(phone, message);
    }
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the SMS.";
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
