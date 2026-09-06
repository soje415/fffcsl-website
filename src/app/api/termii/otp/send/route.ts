import { sendOtp, toInternational } from "@/lib/providers/termii";
import { isDemoMode } from "@/lib/demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = String(body.phone ?? "").trim();
    if (toInternational(phone).length < 11) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "Enter a valid phone number." },
        { status: 400 }
      );
    }
    if (isDemoMode()) {
      return Response.json({ success: true, pinId: "demo" });
    }
    const pinId = await sendOtp(phone);
    return Response.json({ success: true, pinId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the code.";
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
