"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Loader2, Banknote, Landmark, ExternalLink } from "lucide-react";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { monnifyVirtualAccountProvider, mockVirtualAccountProvider } from "@/lib/providers/virtual-account-provider";
import { monnifyCheckoutProvider } from "@/lib/providers/checkout-provider";
import { isDemoMode } from "@/lib/demo-mode";
import type { RegistrationData } from "@/types/registration";

const FEE = 2500;
const DEMO = isDemoMode();
const virtualAccountProvider = DEMO ? mockVirtualAccountProvider : monnifyVirtualAccountProvider;

type Method = "bankTransfer" | "online";

const ALL_METHODS: { id: Method; label: [string, string]; icon: typeof Landmark }[] = [
  { id: "bankTransfer", label: ["Bank Transfer", "Aika kuɗi"], icon: Landmark },
  { id: "online", label: ["Pay with OPay / Bank App", "Biya da OPay / Manhajar banki"], icon: Banknote },
];
// Online checkout has no free-to-run mock (it needs a live session to confirm
// against), so the demo sticks to bank transfer, which mocks instantly.
const METHODS = DEMO ? ALL_METHODS.filter((m) => m.id === "bankTransfer") : ALL_METHODS;

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
  const { t, lang } = useLanguage();
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef(false);

  const method: Method = data.paymentMethod === "online" ? "online" : "bankTransfer";

  async function generateAccount() {
    setError("");
    setGenerating(true);
    try {
      const account = await virtualAccountProvider.createAccount({
        memberId: data.memberId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        dateOfBirth: data.dob,
        address: data.residentialAddress,
        amount: FEE,
      });
      const patch = {
        paymentMethod: "bankTransfer" as const,
        virtualAccountNumber: account.accountNumber,
        virtualAccountBank: account.bankName,
        virtualAccountCustomerId: account.customerId,
      };
      update(patch);
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
      const status = await virtualAccountProvider.checkStatus(
        data.virtualAccountCustomerId,
        FEE,
        lang
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
    if (method !== "bankTransfer") return;
    if (!data.virtualAccountNumber || data.paymentStatus === "paid") return;
    const id = setInterval(() => checkPayment(true), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, data.virtualAccountNumber, data.paymentStatus, data.virtualAccountCustomerId]);

  async function payOnline() {
    setError("");
    setGenerating(true);
    try {
      const { transactionReference, checkoutUrl } = await monnifyCheckoutProvider.initCheckout(data.memberId);
      update({ paymentMethod: "online", checkoutInvoiceId: transactionReference });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not start checkout. Please try again.", "Ba a iya fara biya ba. Da fatan sake gwadawa.")
      );
      setGenerating(false);
    }
  }

  async function checkOnlinePayment(silent: boolean) {
    if (pollingRef.current || !data.checkoutInvoiceId) return;
    pollingRef.current = true;
    if (!silent) setChecking(true);
    try {
      const paid = await monnifyCheckoutProvider.checkStatus(data.checkoutInvoiceId, lang);
      if (paid) {
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

  // Covers the return from the hosted checkout page.
  useEffect(() => {
    if (method !== "online") return;
    if (!data.checkoutInvoiceId || data.paymentStatus === "paid") return;
    const id = setInterval(() => checkOnlinePayment(true), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, data.checkoutInvoiceId, data.paymentStatus]);

  function copyAccount() {
    navigator.clipboard.writeText(data.virtualAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function selectMethod(m: Method) {
    if (data.paymentStatus === "paid") return;
    setError("");
    update({ paymentMethod: m });
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm text-forest-dark">
        <Banknote size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("Live payment.", "Biya ta gaskiya.")}</strong>{" "}
          {DEMO
            ? t(
                `Demo mode simulates the ₦${FEE.toLocaleString()} FFFCSL ID card fee — it confirms itself in a few seconds, no real transfer needed.`,
                `Yanayin gwaji yana kwaikwayon kuɗin katin shaida na FFFCSL na ₦${FEE.toLocaleString()} — zai tabbata da kansa cikin ƴan daƙiƙa, ba tare da ainihin turawa ba.`
              )
            : t(
                `Pay your ₦${FEE.toLocaleString()} FFFCSL ID card fee by bank transfer or your OPay / bank app — this page confirms automatically once it arrives.`,
                `Biya kuɗin katin shaida na FFFCSL na ₦${FEE.toLocaleString()} ta hanyar aika kuɗi ko manhajar OPay / banki — shafin zai tabbatar da kansa da zarar ya iso.`
              )}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectMethod(id)}
            disabled={data.paymentStatus === "paid"}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              method === id
                ? "border-forest bg-forest/10 text-forest-dark"
                : "border-line bg-white text-ink-soft hover:border-forest/40"
            }`}
          >
            <Icon size={18} />
            {t(label[0], label[1])}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta-dark">
          {error}
        </p>
      )}

      {data.paymentStatus === "paid" ? (
        <motion.div
          key="paid"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-3 rounded-xl border border-forest/30 bg-forest/5 p-5 text-forest-dark"
        >
          <Check size={22} />
          <div>
            <p className="font-semibold">{t("Payment Confirmed", "An Tabbatar da Biya")}</p>
            <p className="text-sm text-ink-soft">
              {t(
                `Your ₦${FEE.toLocaleString()} ID card fee has been received.`,
                `An karɓi kuɗin katin shaida na ₦${FEE.toLocaleString()}.`
              )}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {method === "bankTransfer" && (
              <motion.div key="bankTransfer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
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
                  <div className="rounded-xl border border-line bg-white p-6">
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
                  </div>
                )}
              </motion.div>
            )}

            {method === "online" && (
              <motion.div key="online" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {data.checkoutInvoiceId ? (
                  <div className="rounded-xl border border-line bg-white p-6 text-center">
                    <div className="mx-auto flex items-center gap-3 rounded-lg bg-cream-soft p-4 text-left">
                      <Loader2 size={18} className="animate-spin text-forest shrink-0" />
                      <p className="text-sm text-ink-soft">
                        {t(
                          "If you were sent back here before finishing payment, check now or tap the button again to reopen the payment page.",
                          "Idan an dawo da kai nan kafin ka gama biya, danna duba yanzu ko sake danna maballin don sake buɗe shafin biya."
                        )}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={payOnline}
                        disabled={generating}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                      >
                        {generating && <Loader2 size={16} className="animate-spin" />}
                        {t("Reopen Payment Page", "Sake buɗe shafin biya")}
                      </button>
                      <button
                        type="button"
                        onClick={() => checkOnlinePayment(false)}
                        disabled={checking}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:brightness-95 disabled:opacity-60"
                      >
                        {checking && <Loader2 size={16} className="animate-spin" />}
                        {checking ? t("Checking...", "Ana dubawa...") : t("Check Now", "Duba Yanzu")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={payOnline}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                    {generating
                      ? t("Redirecting...", "Ana turawa...")
                      : t(`Pay ₦${FEE.toLocaleString()} Now`, `Biya ₦${FEE.toLocaleString()} Yanzu`)}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <StepNav
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={data.paymentStatus !== "paid"}
      />
    </div>
  );
}
