import { verifyOtp } from "@/lib/providers/termii";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { pinId?: string; pin?: string };
    const pinId = String(body.pinId ?? "").trim();
    const pin = String(body.pin ?? "").trim();
    if (!pinId || !pin) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "PIN id and code are required." },
        { status: 400 }
      );
    }
    const verified = await verifyOtp(pinId, pin);
    return Response.json({ success: true, verified });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not verify the code.";
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
