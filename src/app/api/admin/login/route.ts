import { checkRateLimit, clearRateLimit, logAdminEvent, peekRateLimit } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminSessionKey,
  createSessionToken,
  timingSafePasswordEqual,
} from "@/lib/admin-auth";
import { clientIp, crossOriginBlocked, readJson } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lockouts count only wrong PINs. A 6-digit PIN has 1M possibilities, so besides
// a per-IP limit there's a global ceiling that makes spreading guesses across
// many IPs pointless (the trade-off: sustained guessing also delays the real admin).
const IP_FAILS = 5;
const IP_WINDOW = 15 * 60;
const GLOBAL_FAILS = 100;
const GLOBAL_WINDOW = 60 * 60;

const NO_STORE = { "Cache-Control": "no-store" };

function locked() {
  return Response.json(
    { success: false, error: "Too many incorrect attempts. Try again later." },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(IP_WINDOW) } }
  );
}

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const ipKey = `admin-fail:${ip}`;
  const globalKey = "admin-fail:global";

  try {
    if (
      !(await peekRateLimit(ipKey, IP_FAILS, IP_WINDOW)) ||
      !(await peekRateLimit(globalKey, GLOBAL_FAILS, GLOBAL_WINDOW))
    ) {
      await logAdminEvent("login_locked", ip);
      return locked();
    }

    const adminPin = process.env.ADMIN_PIN;
    const sessionKey = adminSessionKey();
    if (!adminPin || !sessionKey) {
      console.error("[admin-login] ADMIN_PIN / ADMIN_SESSION_SECRET not configured");
      return Response.json(
        { success: false, error: "Admin login is not configured." },
        { status: 500, headers: NO_STORE }
      );
    }

    const parsed = await readJson(req, 512);
    const pin = parsed.data && typeof parsed.data.pin === "string" ? parsed.data.pin : "";
    if (!/^\d{6}$/.test(pin) || !(await timingSafePasswordEqual(pin, adminPin))) {
      await checkRateLimit(ipKey, IP_FAILS, IP_WINDOW);
      await checkRateLimit(globalKey, GLOBAL_FAILS, GLOBAL_WINDOW);
      await logAdminEvent("login_failed", ip);
      return Response.json({ success: false, error: "Incorrect PIN." }, { status: 401, headers: NO_STORE });
    }

    await clearRateLimit(ipKey);
    await logAdminEvent("login_ok", ip);

    const token = await createSessionToken(sessionKey);
    const res = Response.json({ success: true }, { headers: NO_STORE });
    res.headers.append(
      "Set-Cookie",
      `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`
    );
    return res;
  } catch (err) {
    console.error("[admin-login]", err instanceof Error ? err.message : "error");
    return Response.json(
      { success: false, error: "Something went wrong. Try again." },
      { status: 500, headers: NO_STORE }
    );
  }
}
