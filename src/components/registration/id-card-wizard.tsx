"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Stepper } from "@/components/registration/stepper";
import { LanguageProvider, useLanguage } from "@/components/registration/language";
import { LanguageToggle } from "@/components/registration/language-toggle";
import { TokenEntryStep } from "@/components/registration/steps/token-entry-step";
import { PaymentStep } from "@/components/registration/steps/payment-step";
import { VerificationStep } from "@/components/registration/steps/verification-step";
import { SuccessStep } from "@/components/registration/steps/success-step";
import { isDemoMode } from "@/lib/demo-mode";
import {
  EMPTY_REGISTRATION,
  ID_CARD_STEP_LABELS,
  ID_CARD_STEP_LABELS_HA,
  type RegistrationData,
} from "@/types/registration";

const STORAGE_KEY = "fffcsl-idcard-draft";

type WizardState = { step: number; data: RegistrationData };

function readDraft(): WizardState | null {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Partial<WizardState>;
    if (!parsed.data?.memberId) return null;
    return {
      step: typeof parsed.step === "number" ? parsed.step : 0,
      data: { ...EMPTY_REGISTRATION, ...parsed.data },
    };
  } catch {
    return null;
  }
}

function WizardHeader({ onStartOver }: { onStartOver: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <LanguageToggle />
        {isDemoMode() && (
          <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-walnut-dark">
            {t("Demo Mode", "Yanayin Gwaji")}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onStartOver}
        className="text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-forest-dark"
      >
        {t("Use a Different Token", "Yi Amfani da Wata Lambar")}
      </button>
    </div>
  );
}

function IdCardWizardInner() {
  const searchParams = useSearchParams();
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    // A token in the URL is an explicit request to resume that farmer's
    // application — never silently substitute a different one left in
    // localStorage from an earlier session on this device (e.g. a shared
    // or kiosk computer).
    const urlToken = searchParams.get("token");
    const wantsDifferentToken = urlToken && draft && draft.data.memberId !== urlToken;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWizard(wantsDifferentToken ? null : draft);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !wizard) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wizard));
  }, [wizard, hydrated]);

  function update(patch: Partial<RegistrationData>) {
    setWizard((w) => {
      if (!w) return w;
      const next = { ...w, data: { ...w.data, ...patch } };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function setStep(fn: (s: number) => number) {
    setWizard((w) => (w ? { ...w, step: fn(w.step) } : w));
  }

  function next() {
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startOver() {
    window.localStorage.removeItem(STORAGE_KEY);
    setWizard(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    return null;
  }

  if (!wizard) {
    return (
      <LanguageProvider>
        <section className="py-12 sm:py-16">
          <Container className="max-w-2xl">
            <div className="mb-4 flex items-center justify-end">
              <LanguageToggle />
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 sm:p-9">
              <TokenEntryStep
                initialToken={searchParams.get("token") ?? undefined}
                onResolved={(data) => setWizard({ step: 0, data })}
              />
            </div>
          </Container>
        </section>
      </LanguageProvider>
    );
  }

  const { step, data } = wizard;

  const steps = [
    <PaymentStep key="0" data={data} update={update} onNext={next} onBack={startOver} />,
    <VerificationStep key="1" data={data} update={update} onNext={next} onBack={back} />,
    <SuccessStep key="2" data={data} update={update} onStartNew={startOver} />,
  ];

  return (
    <LanguageProvider>
      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          {step < steps.length - 1 && (
            <div className="mb-10">
              <WizardHeader onStartOver={startOver} />
              <Stepper current={step} labels={ID_CARD_STEP_LABELS} hausaLabels={ID_CARD_STEP_LABELS_HA} />
            </div>
          )}
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>
        </Container>
      </section>
    </LanguageProvider>
  );
}

export function IdCardWizard() {
  return <IdCardWizardInner />;
}
