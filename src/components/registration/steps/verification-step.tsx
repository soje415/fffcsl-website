"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FlaskConical, Loader2, ShieldCheck } from "lucide-react";
import { FieldWrap, TextInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { mockIdentityVerifier } from "@/lib/providers/identity-verifier";
import { STATE_CODES } from "@/lib/ng-locations";
import type { RegistrationData } from "@/types/registration";

function generateMemberId(state: string) {
  const code = STATE_CODES[state] ?? "NG";
  const serial = Math.floor(100000 + Math.random() * 899999);
  return `FFFCSL/${code}/${serial}`;
}

export function VerificationStep({
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
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const bvnValid = /^\d{11}$/.test(data.bvn);
  const ninValid = /^\d{11}$/.test(data.nin);

  async function handleVerify() {
    if (!bvnValid || !ninValid) {
      setError("BVN and NIN must each be exactly 11 digits.");
      return;
    }
    setError("");
    setChecking(true);
    const result = await mockIdentityVerifier.verify({
      bvn: data.bvn,
      nin: data.nin,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
    });
    setChecking(false);
    if (result.status === "verified") {
      update({
        verificationStatus: "verified",
        memberId: data.memberId || generateMemberId(data.state),
      });
    } else {
      update({ verificationStatus: "mismatch" });
    }
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-walnut-dark">
        <FlaskConical size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>Test Mode.</strong> BVN/NIN lookups here are simulated for
          preview purposes. Live verification connects to Hyparrow once
          credentials are added — real BVN/NIN are never verified or stored
          by this preview.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Bank Verification Number (BVN)">
          <TextInput
            required
            inputMode="numeric"
            maxLength={11}
            placeholder="11-digit BVN"
            value={data.bvn}
            onChange={(e) => update({ bvn: e.target.value.replace(/\D/g, "") })}
          />
        </FieldWrap>
        <FieldWrap label="National Identification Number (NIN)">
          <TextInput
            required
            inputMode="numeric"
            maxLength={11}
            placeholder="11-digit NIN"
            value={data.nin}
            onChange={(e) => update({ nin: e.target.value.replace(/\D/g, "") })}
          />
        </FieldWrap>
      </div>

      {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {data.verificationStatus === "verified" ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-forest/30 bg-forest/5 p-5 text-forest-dark"
            >
              <Check size={22} />
              <div>
                <p className="font-semibold">Identity Verified</p>
                <p className="text-sm text-ink-soft">
                  Your details match the records on file.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="verify-btn"
              type="button"
              onClick={handleVerify}
              disabled={checking}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
            >
              {checking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {checking ? "Verifying..." : "Verify Identity (Test)"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <StepNav
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={data.verificationStatus !== "verified"}
        nextLabel="Get My Membership ID"
      />
    </div>
  );
}
