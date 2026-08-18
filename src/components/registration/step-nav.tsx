"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/registration/language";

export function StepNav({
  onBack,
  showBack = true,
  nextLabel,
  nextDisabled = false,
  nextType = "submit",
  onNext,
}: {
  onBack?: () => void;
  showBack?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextType?: "submit" | "button";
  onNext?: () => void;
}) {
  const { t } = useLanguage();
  const label = nextLabel ?? t("Continue", "Ci gaba");

  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-forest-dark"
        >
          <ArrowLeft size={16} />
          {t("Back", "Baya")}
        </button>
      ) : (
        <span />
      )}
      <button
        type={nextType}
        onClick={nextType === "button" ? onNext : undefined}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
