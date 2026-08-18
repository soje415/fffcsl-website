"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Loader2, Banknote } from "lucide-react";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { hyparrowVirtualAccountProvider } from "@/lib/providers/virtual-account-provider";
import type { RegistrationData } from "@/types/registration";

const FEE = 3000;

export function PaymentStep({
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
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef(false);

  async function generateAccount() {
    setError("");
    setGenerating(true);
    try {
      const account = await hyparrowVirtualAccountProvider.createAccount({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        dateOfBirth: data.dob,
        address: data.residentialAddress,
        amount: FEE,
      });
      update({
        virtualAccountNumber: account.accountNumber,
        virtualAccountBank: account.bankName,
        virtualAccountCustomerId: account.customerId,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not generate a payment account.", "Ba a iya samar da asusun biyan kuɗi ba.")
      );
    } finally {
      setGenerating(false);
    }
  }

  async function checkPayment(silent: boolean) {
    if (pollingRef.current) return;
    pollingRef.current = true;
    if (!silent) setChecking(true);
    try {
      const status = await hyparrowVirtualAccountProvider.checkStatus(
        data.virtualAccountCustomerId,
        FEE
      );
      if (status === "paid") {
        update({ paymentStatus: "paid" });
      } else if (!silent) {
        setError(
          t(
            "We haven't received your payment yet. Try again in a moment.",
            "Ba mu karɓi biyan kuɗinka ba tukuna. Ka sake gwadawa nan gaba."
          )
        );
      }
    } catch {
      if (!silent) {
        setError(t("Could not confirm payment.", "Ba a iya tabbatar da biyan kuɗi ba."));
      }
    } finally {
      pollingRef.current = false;
      if (!silent) setChecking(false);
    }
  }

  // Auto-poll for the transfer once the account exists, until it is marked paid.
  useEffect(() => {
    if (!data.virtualAccountNumber || data.paymentStatus === "paid") return;
    const id = setInterval(() => checkPayment(true), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.virtualAccountNumber, data.paymentStatus, data.virtualAccountCustomerId]);

  function copyAccount() {
    navigator.clipboard.writeText(data.virtualAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm text-forest-dark">
        <Banknote size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("Live payment.", "Biya ta gaskiya.")}</strong>{" "}
          {t(
            "A dedicated FFFCSL virtual account is created for you via Hyparrow. Transfer exactly",
            "Ana samar maka asusun FFFCSL na musamman ta Hyparrow. Aika daidai"
          )}{" "}
          <strong>₦{FEE.toLocaleString()}</strong>{" "}
          {t(
            "to it — this page will confirm automatically once it arrives.",
            "zuwa gare shi — shafin zai tabbatar da kansa da zarar ya iso."
          )}
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta-dark">
          {error}
        </p>
      )}

      <div className="mt-6">
        {!data.virtualAccountNumber ? (
          <button
            type="button"
            onClick={generateAccount}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
          >
            {generating && <Loader2 size={16} className="animate-spin" />}
            {generating
              ? t("Creating your account...", "Ana ƙirƙirar asusunka...")
              : t("Generate Payment Account", "Samar da Asusun Biyan Kuɗi")}
          </button>
        ) : (
          <AnimatePresence mode="wait">
            {data.paymentStatus === "paid" ? (
              <motion.div
                key="paid"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl border border-forest/30 bg-forest/5 p-5 text-forest-dark"
              >
                <Check size={22} />
                <div>
                  <p className="font-semibold">
                    {t("Payment Confirmed", "An Tabbatar da Biya")}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {t(
                      `Your ₦${FEE.toLocaleString()} ID card fee has been received.`,
                      `An karɓi kuɗin katin shaida na ₦${FEE.toLocaleString()}.`
                    )}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-line bg-white p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
                  {t("Pay Exactly", "Biya daidai")}
                </p>
                <p className="mt-1 font-serif text-3xl font-semibold text-forest-dark">
                  ₦{FEE.toLocaleString()}
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <span className="text-ink-soft">{t("Bank", "Banki")}</span>
                    <span className="font-medium text-ink">{data.virtualAccountBank}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <span className="text-ink-soft">
                      {t("Account Number", "Lambar asusu")}
                    </span>
                    <button
                      type="button"
                      onClick={copyAccount}
                      className="inline-flex items-center gap-1.5 font-mono font-medium text-forest-dark"
                    >
                      {data.virtualAccountNumber}
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">{t("Account Name", "Sunan asusu")}</span>
                    <span className="text-right font-medium text-ink">
                      {data.virtualAccountBank
                        ? `FFFCSL / ${data.firstName} ${data.lastName}`.toUpperCase()
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-lg bg-cream-soft p-4">
                  <Loader2 size={18} className="animate-spin text-forest" />
                  <p className="text-sm text-ink-soft">
                    {t(
                      "Waiting for your transfer — checking automatically…",
                      "Ana jiran tura kuɗin ka — ana dubawa ta atomatik…"
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => checkPayment(false)}
                  disabled={checking}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:brightness-95 disabled:opacity-60"
                >
                  {checking && <Loader2 size={16} className="animate-spin" />}
                  {checking
                    ? t("Checking...", "Ana dubawa...")
                    : t("Check Now", "Duba Yanzu")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <StepNav
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={data.paymentStatus !== "paid"}
      />
    </div>
  );
}
