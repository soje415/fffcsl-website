"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Loader2, Banknote, Smartphone, Landmark } from "lucide-react";
import { StepNav } from "@/components/registration/step-nav";
import { SelectInput } from "@/components/registration/field";
import { useLanguage } from "@/components/registration/language";
import { hyparrowVirtualAccountProvider } from "@/lib/providers/virtual-account-provider";
import { hyparrowCheckoutProvider } from "@/lib/providers/checkout-provider";
import { otpProvider } from "@/lib/providers/otp-provider";
import { submitRegistration } from "@/lib/providers/registration-provider";
import { USSD_BANKS } from "@/lib/ussd-banks";
import type { RegistrationData } from "@/types/registration";

const FEE = 2000;

type Method = "bankTransfer" | "ussd" | "opay";

const METHODS: { id: Method; label: [string, string]; icon: typeof Landmark }[] = [
  { id: "bankTransfer", label: ["Bank Transfer", "Aika kuɗi"], icon: Landmark },
  { id: "ussd", label: ["USSD", "USSD"], icon: Smartphone },
  { id: "opay", label: ["Pay with OPay", "Biya da OPay"], icon: Banknote },
];

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
  const [bankCode, setBankCode] = useState(data.ussdBankCode);
  const pollingRef = useRef(false);

  const method: Method = data.paymentMethod || "bankTransfer";

  function sendPaymentSms() {
    if (data.paymentSmsSent || !data.phone) return;
    const message =
      lang === "ha"
        ? `An karɓi biyan kuɗi! An tabbatar da kuɗin katin shaida na N${FEE.toLocaleString()} na FFFCSL. Na gode.`
        : `Payment received! Your N${FEE.toLocaleString()} FFFCSL ID card fee is confirmed. Thank you.`;
    otpProvider
      .sendSms(data.phone, message)
      .then(() => update({ paymentSmsSent: true }))
      .catch(() => {
        /* SMS is best-effort; do not block confirmation */
      });
  }

  // Persists payment progress incrementally so a farmer can resume the ID
  // card flow later, by token, from another device without losing it.
  function saveProgress(patch: Partial<RegistrationData>) {
    submitRegistration({ ...data, ...patch }).catch(() => {
      /* best-effort; the local wizard state is still authoritative for this session */
    });
  }

  async function generateAccount() {
    setError("");
    setGenerating(true);
    try {
      const account = await hyparrowVirtualAccountProvider.createAccount({
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
      saveProgress(patch);
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
        sendPaymentSms();
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

  async function ensureInvoice(): Promise<string> {
    if (data.checkoutInvoiceId) return data.checkoutInvoiceId;
    const invoiceId = await hyparrowCheckoutProvider.createInvoice({
      memberId: data.memberId,
      amount: FEE,
      customerName: `${data.firstName} ${data.lastName}`.trim(),
      customerEmail: data.email,
    });
    update({ checkoutInvoiceId: invoiceId });
    saveProgress({ checkoutInvoiceId: invoiceId });
    return invoiceId;
  }

  async function generateUssd() {
    if (!bankCode) {
      setError(t("Select your bank first.", "Fara zaɓi bankinka."));
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const invoiceId = await ensureInvoice();
      const ussdCode = await hyparrowCheckoutProvider.generateUssd(invoiceId, bankCode);
      const patch = { paymentMethod: "ussd" as const, ussdCode, ussdBankCode: bankCode };
      update(patch);
      saveProgress(patch);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not generate a USSD code.", "Ba a iya samar da lambar USSD ba.")
      );
    } finally {
      setGenerating(false);
    }
  }

  async function payWithOpay() {
    setError("");
    setGenerating(true);
    try {
      const invoiceId = await ensureInvoice();
      update({ paymentMethod: "opay" });
      saveProgress({ paymentMethod: "opay" });
      const redirectUrl = await hyparrowCheckoutProvider.initOpay(invoiceId);
      window.location.href = redirectUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not start OPay checkout.", "Ba a iya fara biyan OPay ba.")
      );
      setGenerating(false);
    }
  }

  async function checkCheckoutPayment(silent: boolean) {
    if (pollingRef.current || !data.checkoutInvoiceId) return;
    pollingRef.current = true;
    if (!silent) setChecking(true);
    try {
      const paid = await hyparrowCheckoutProvider.checkStatus(data.checkoutInvoiceId);
      if (paid) {
        update({ paymentStatus: "paid" });
        sendPaymentSms();
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

  // Covers both USSD (waiting for the dial) and OPay (after the redirect back).
  useEffect(() => {
    if (method !== "ussd" && method !== "opay") return;
    if (!data.checkoutInvoiceId || data.paymentStatus === "paid") return;
    const id = setInterval(() => checkCheckoutPayment(true), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, data.checkoutInvoiceId, data.paymentStatus]);

  function copyAccount() {
    navigator.clipboard.writeText(data.virtualAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function copyUssd() {
    navigator.clipboard.writeText(data.ussdCode);
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
          {t(
            `Pay your ₦${FEE.toLocaleString()} FFFCSL ID card fee by bank transfer, USSD, or OPay — this page confirms automatically once it arrives.`,
            `Biya kuɗin katin shaida na FFFCSL na ₦${FEE.toLocaleString()} ta hanyar aika kuɗi, USSD, ko OPay — shafin zai tabbatar da kansa da zarar ya iso.`
          )}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
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

            {method === "ussd" && (
              <motion.div key="ussd" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {!data.ussdCode ? (
                  <div className="rounded-xl border border-line bg-white p-6">
                    <label className="text-sm font-medium text-ink-soft">
                      {t("Select your bank", "Zaɓi bankinka")}
                    </label>
                    <SelectInput
                      className="mt-1.5"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                    >
                      <option value="" disabled>
                        {t("Select a bank", "Zaɓi banki")}
                      </option>
                      {USSD_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </SelectInput>
                    <button
                      type="button"
                      onClick={generateUssd}
                      disabled={generating || !bankCode}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                    >
                      {generating && <Loader2 size={16} className="animate-spin" />}
                      {generating
                        ? t("Generating code...", "Ana samar da lambar...")
                        : t("Generate USSD Code", "Samar da Lambar USSD")}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-line bg-white p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
                      {t("Dial this code", "Bugi wannan lambar")}
                    </p>
                    <button
                      type="button"
                      onClick={copyUssd}
                      className="mx-auto mt-2 inline-flex items-center gap-2 font-mono text-3xl font-semibold text-forest-dark"
                    >
                      {data.ussdCode}
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <p className="mt-2 text-sm text-ink-soft">
                      {t(
                        `Dial this on your phone to pay ₦${FEE.toLocaleString()} — checking automatically…`,
                        `Bugi wannan a wayarka don biyan ₦${FEE.toLocaleString()} — ana dubawa ta atomatik…`
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => checkCheckoutPayment(false)}
                      disabled={checking}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:brightness-95 disabled:opacity-60"
                    >
                      {checking && <Loader2 size={16} className="animate-spin" />}
                      {checking ? t("Checking...", "Ana dubawa...") : t("Check Now", "Duba Yanzu")}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {method === "opay" && (
              <motion.div key="opay" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {data.checkoutInvoiceId ? (
                  <div className="rounded-xl border border-line bg-white p-6 text-center">
                    <div className="mx-auto flex items-center gap-3 rounded-lg bg-cream-soft p-4 text-left">
                      <Loader2 size={18} className="animate-spin text-forest shrink-0" />
                      <p className="text-sm text-ink-soft">
                        {t(
                          "If you were sent back here before finishing on OPay, check now or tap the button again to reopen OPay.",
                          "Idan an dawo da kai nan kafin ka gama a OPay, danna duba yanzu ko sake danna maballin don sake buɗe OPay."
                        )}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={payWithOpay}
                        disabled={generating}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                      >
                        {generating && <Loader2 size={16} className="animate-spin" />}
                        {t("Reopen OPay", "Sake buɗe OPay")}
                      </button>
                      <button
                        type="button"
                        onClick={() => checkCheckoutPayment(false)}
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
                    onClick={payWithOpay}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                  >
                    {generating && <Loader2 size={16} className="animate-spin" />}
                    {generating
                      ? t("Redirecting to OPay...", "Ana kai ka OPay...")
                      : t(`Pay ₦${FEE.toLocaleString()} with OPay`, `Biya ₦${FEE.toLocaleString()} da OPay`)}
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
