"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Stepper } from "@/components/registration/stepper";
import { LanguageProvider, useLanguage } from "@/components/registration/language";
import { LanguageToggle } from "@/components/registration/language-toggle";
import { PersonalStep } from "@/components/registration/steps/personal-step";
import { PhoneVerificationStep } from "@/components/registration/steps/phone-verification-step";
import { AddressFarmStep } from "@/components/registration/steps/address-farm-step";
import { NextOfKinStep } from "@/components/registration/steps/next-of-kin-step";
import { ConsentStep } from "@/components/registration/steps/consent-step";
import { PaymentStep } from "@/components/registration/steps/payment-step";
import { VerificationStep } from "@/components/registration/steps/verification-step";
import { SuccessStep } from "@/components/registration/steps/success-step";
import { EMPTY_REGISTRATION, type RegistrationData } from "@/types/registration";

const STORAGE_KEY = "fffcsl-registration-draft";

type WizardState = { step: number; data: RegistrationData };

function readDraft(): WizardState {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { step: 0, data: EMPTY_REGISTRATION };
  try {
    const parsed = JSON.parse(saved) as Partial<WizardState>;
    return {
      step: typeof parsed.step === "number" ? parsed.step : 0,
      data: { ...EMPTY_REGISTRATION, ...(parsed.data ?? {}) },
    };
  } catch {
    return { step: 0, data: EMPTY_REGISTRATION };
  }
}

function WizardHeader({ onStartNew }: { onStartNew: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mb-4 flex items-center justify-between">
      <LanguageToggle />
      <button
        type="button"
        onClick={onStartNew}
        className="text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-forest-dark"
      >
        {t("Start Over", "Fara sabo")}
      </button>
    </div>
  );
}

export function RegistrationWizard() {
  const [{ step, data }, setWizard] = useState<WizardState>({
    step: 0,
    data: EMPTY_REGISTRATION,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Deliberate: initial render must match SSR (empty state) for hydration,
    // so the localStorage draft can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWizard(readDraft());
    setHydrated(true);
  }, []);

  function setStep(fn: (s: number) => number) {
    setWizard((w) => ({ ...w, step: fn(w.step) }));
  }

  function setData(fn: (d: RegistrationData) => RegistrationData) {
    setWizard((w) => ({ ...w, data: fn(w.data) }));
  }

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
  }, [step, data, hydrated]);

  function update(patch: Partial<RegistrationData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, 7));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    window.localStorage.removeItem(STORAGE_KEY);
    setWizard({ step: 0, data: EMPTY_REGISTRATION });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) return null;

  const steps = [
    <PersonalStep key="0" data={data} update={update} onNext={next} />,
    <PhoneVerificationStep key="1" data={data} update={update} onNext={next} onBack={back} />,
    <AddressFarmStep key="2" data={data} update={update} onNext={next} onBack={back} />,
    <NextOfKinStep key="3" data={data} update={update} onNext={next} onBack={back} />,
    <ConsentStep key="4" data={data} update={update} onNext={next} onBack={back} />,
    <PaymentStep key="5" data={data} update={update} onNext={next} onBack={back} />,
    <VerificationStep key="6" data={data} update={update} onNext={next} onBack={back} />,
    <SuccessStep key="7" data={data} update={update} onStartNew={startNew} />,
  ];

  return (
    <LanguageProvider>
      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          {step < 6 && (
            <div className="mb-10">
              <WizardHeader onStartNew={startNew} />
              <Stepper current={step} />
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
