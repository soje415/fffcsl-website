"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, MessageSquareText, Smartphone } from "lucide-react";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { otpProvider } from "@/lib/providers/otp-provider";
import { isDemoMode } from "@/lib/demo-mode";
import type { RegistrationData } from "@/types/registration";

export function PhoneVerificationStep({
  data,
  update,
  onNext,
  onBack,
}: {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [pinId, setPinId] = useState("");
  const [pin, setPin] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setError("");
    setSending(true);
    try {
      const id = await otpProvider.send(data.phone);
      setPinId(id);
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not send the code.", "Ba a iya aika lambar ba."));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!pinId) {
      setError(t("Send a code first.", "Fara aika lambar."));
      return;
    }
    if (pin.length < 4) {
      setError(t("Enter the code you received.", "Shigar da lambar da ka karɓa."));
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const verified = await otpProvider.verify(pinId, pin);
      if (verified) {
        update({ phoneVerified: true });
      } else {
        setError(t("Incorrect code. Please try again.", "Lambar ba daidai ba ce. Sake gwadawa."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not verify the code.", "Ba a iya tabbatar da lambar ba."));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm text-forest-dark">
        <Smartphone size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("Verify your phone number.", "Tabbatar da lambar wayarka.")}</strong>{" "}
          {t(
            "We'll send a one-time code to the number below to confirm it's reachable and belongs to you.",
            "Za mu aika maka lambar tabbatarwa zuwa lambar da ke ƙasa don tabbatar da cewa naka ce."
          )}
        </p>
      </div>

      {isDemoMode() && (
        <p className="mt-3 text-xs font-medium text-terracotta-dark">
          {t(
            "Demo mode: any code you enter will be accepted.",
            "Yanayin gwaji: kowace lambar da ka shigar za a karɓa."
          )}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-line bg-cream-soft p-4">
        <p className="text-sm font-medium text-ink-soft">
          {t("Phone number", "Lambar waya")}
        </p>
        <p className="mt-0.5 font-mono text-lg font-semibold text-forest-dark">{data.phone}</p>
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {data.phoneVerified ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-forest/30 bg-forest/5 p-5 text-forest-dark"
            >
              <Check size={22} />
              <div>
                <p className="font-semibold">{t("Phone Verified", "An Tabbatar da Wayar")}</p>
                <p className="text-sm text-ink-soft">
                  {t("Your number is confirmed.", "An tabbatar da lambarka.")}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {!pinId ? (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || !data.phone}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareText size={16} />}
                  {sending
                    ? t("Sending code...", "Ana aika lambar...")
                    : t("Send Verification Code", "Aika Lambar Tabbatarwa")}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-ink-soft">
                      {t("Enter the 6-digit code", "Shigar da lambar lambobi 6")}
                    </label>
                    <input
                      autoFocus
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleVerify();
                      }}
                      className="mt-1.5 w-full rounded-lg border border-line bg-cream px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-ink outline-none focus:border-forest"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={verifying}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                    >
                      {verifying && <Loader2 size={16} className="animate-spin" />}
                      {verifying ? t("Verifying...", "Ana tabbatarwa...") : t("Verify Code", "Tabbatar da Lambar")}
                    </button>
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={sending}
                      className="text-sm font-medium text-ink-soft underline underline-offset-2 hover:text-forest-dark"
                    >
                      {t("Resend code", "Sake aika lambar")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}

      <StepNav
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={!data.phoneVerified}
      />
    </div>
  );
}
