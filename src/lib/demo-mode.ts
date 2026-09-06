/**
 * Client-demo toggle for the ID card wizard: when on, payment, phone OTP,
 * and BVN/NIN verification all use fast, free mocks instead of the live
 * (paid) Hyparrow/Termii integrations, so a walkthrough doesn't need a real
 * transfer, a real SMS, or a real identity lookup. Off by default — only
 * flip NEXT_PUBLIC_DEMO_MODE=true for the test phase, never in production.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
