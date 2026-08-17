"use client";

import type { FormEvent } from "react";
import { StepNav } from "@/components/registration/step-nav";
import type { RegistrationData } from "@/types/registration";

export function ConsentStep({
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
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-cream-soft p-5 text-sm leading-relaxed text-ink-soft">
          <p>
            FFFCSL collects your personal, identity, and farm information to
            process your cooperative membership, verify your identity, and
            maintain accurate farmer records in line with the Nigeria Data
            Protection Regulation (NDPR). Your BVN and NIN are used solely for
            identity verification and are never displayed on your membership
            card or shared publicly.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <input
            required
            type="checkbox"
            checked={data.consentData}
            onChange={(e) => update({ consentData: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
          />
          <span className="text-sm text-ink-soft">
            I consent to FFFCSL collecting and processing my personal and
            identity data for the purpose of cooperative membership and
            identity verification.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <input
            required
            type="checkbox"
            checked={data.consentTerms}
            onChange={(e) => update({ consentTerms: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
          />
          <span className="text-sm text-ink-soft">
            I agree to the terms of FFFCSL membership, including the one-time
            ₦3,000 non-refundable ID card processing fee.
          </span>
        </label>
      </div>
      <StepNav onBack={onBack} />
    </form>
  );
}
