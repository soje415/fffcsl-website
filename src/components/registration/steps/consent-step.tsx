"use client";

import type { FormEvent } from "react";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
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
  const { t } = useLanguage();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-cream-soft p-5 text-sm leading-relaxed text-ink-soft">
          <p>
            {t(
              "FFFCSL collects your personal, identity, and farm information to process your cooperative membership, verify your identity, and maintain accurate farmer records in line with the Nigeria Data Protection Regulation (NDPR). Your BVN and NIN are used solely for identity verification and are never displayed on your membership card or shared publicly.",
              "FFFCSL na tattara bayanan ka na kai, na tantancewa, da na gona don sarrafa zama memba na kungiyar, tabbatar da asalinka, da kiyaye ingantattun bayanan manoma bisa dokar kare bayanan Najeriya (NDPR). Ana amfani da BVN da NIN ɗinka kawai don tabbatar da asali, ba a nuna su a katin memba ko a raba su a fili."
            )}
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
            {t(
              "I consent to FFFCSL collecting and processing my personal and identity data for the purpose of cooperative membership and identity verification.",
              "Na yarda FFFCSL ta tattara da sarrafa bayanana na kai da na tantancewa don zama memba na kungiyar da tabbatar da asalina."
            )}
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
            {t(
              "I agree to the terms of FFFCSL membership, including the one-time ₦2,000 non-refundable ID card processing fee.",
              "Na yarda da sharuɗɗan zama memba na FFFCSL, gami da kuɗin sarrafa katin shaida na ₦2,000 wanda ba a mayarwa."
            )}
          </span>
        </label>
      </div>
      <StepNav onBack={onBack} />
    </form>
  );
}
