/**
 * Issued at pre-registration, before we know the farmer's state — so unlike
 * the old scheme this is not location-prefixed. It doubles as the farmer's
 * permanent member ID once the ID card is issued.
 *
 * Runs in the browser, so it draws from the Web Crypto API rather than
 * Math.random() over a 9-digit space (~900M values/year) — the token is
 * looked up without auth, so it needs to resist guessing/enumeration, not
 * just collisions.
 */
export function generateToken() {
  const year = new Date().getFullYear();
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const serial = 100000000 + (buf[0] % 900000000);
  return `FFFCSL/${year}/${serial}`;
}
