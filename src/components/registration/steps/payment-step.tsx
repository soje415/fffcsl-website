"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FlaskConical, Loader2 } from "lucide-react";
import { StepNav } from "@/components/registration/step-nav";
import { mockVirtualAccountProvider } from "@/lib/providers/virtual-account-provider";
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
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateAccount() {
    setGenerating(true);
    const account = await mockVirtualAccountProvider.createAccount({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      amount: FEE,
    });
    update({
      virtualAccountNumber: account.accountNumber,
      virtualAccountBank: account.bankName,
    });
    setGenerating(false);
  }

  async function simulatePayment() {
    setConfirming(true);
    await mockVirtualAccountProvider.checkStatus(data.virtualAccountNumber);
    update({ paymentStatus: "paid" });
    setConfirming(false);
  }

  function copyAccount() {
    navigator.clipboard.writeText(data.virtualAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-walnut-dark">
        <FlaskConical size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>Test Mode.</strong> This is a preview of the payment flow.
          No real bank account is generated and no money is collected here —
          it will connect to Hyparrow&apos;s live virtual account API once
          credentials are added.
        </p>
      </div>

      <div className="mt-6">
        {!data.virtualAccountNumber ? (
          <button
            type="button"
            onClick={generateAccount}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
          >
            {generating && <Loader2 size={16} className="animate-spin" />}
            {generating ? "Generating account..." : "Generate Payment Account"}
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
                  <p className="font-semibold">Payment Confirmed</p>
                  <p className="text-sm text-ink-soft">
                    Your ₦{FEE.toLocaleString()} ID card fee has been received.
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
                  Pay Exactly
                </p>
                <p className="mt-1 font-serif text-3xl font-semibold text-forest-dark">
                  ₦{FEE.toLocaleString()}
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <span className="text-ink-soft">Bank</span>
                    <span className="font-medium text-ink">{data.virtualAccountBank}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <span className="text-ink-soft">Account Number</span>
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
                    <span className="text-ink-soft">Account Name</span>
                    <span className="text-right font-medium text-ink">
                      {data.virtualAccountBank ? `FFFCSL / ${data.firstName} ${data.lastName}`.toUpperCase() : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={simulatePayment}
                  disabled={confirming}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:brightness-95 disabled:opacity-60"
                >
                  {confirming && <Loader2 size={16} className="animate-spin" />}
                  {confirming ? "Checking for payment..." : "Simulate Payment Received (Test)"}
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
