"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Stepper } from "@/components/registration/stepper";
import { LanguageProvider, useLanguage } from "@/components/registration/language";
import { LanguageToggle } from "@/components/registration/language-toggle";
import { PersonalStep } from "@/components/registration/steps/personal-step";
import { AddressFarmStep } from "@/components/registration/steps/address-farm-step";
import { NextOfKinStep } from "@/components/registration/steps/next-of-kin-step";
import { ConsentStep } from "@/components/registration/steps/consent-step";
import { generateToken } from "@/lib/member-id";
import { submitRegistration } from "@/lib/providers/registration-provider";
import {
  EMPTY_REGISTRATION,
  REGISTER_STEP_LABELS,
  REGISTER_STEP_LABELS_HA,
  type RegistrationData,
} from "@/types/registration";

const STORAGE_KEY = "fffcsl-register-draft";
const LAST_STEP = 3;

type WizardState = { step: number; data: RegistrationData };

function readDraft(): WizardState {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { step: 0, data: EMPTY_REGISTRATION };
  try {
    const parsed = JSON.parse(saved) as Partial<WizardState>;
    return {
      step: typeof parsed.step === "number" ? parsed.step : 0,
      data: { ...EMPTY_REGISTRATION, ...parsed.data },
    };
  } catch {
    return { step: 0, data: EMPTY_REGISTRATION };
  }
}

function PreRegisterFormInner() {
  const { t } = useLanguage();
  const [wizard, setWizard] = useState<WizardState>({ step: 0, data: EMPTY_REGISTRATION });
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWizard(readDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || token) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wizard));
  }, [wizard, hydrated, token]);

  function update(patch: Partial<RegistrationData>) {
    setWizard((w) => ({ ...w, data: { ...w.data, ...patch } }));
  }

  function setStep(fn: (s: number) => number) {
    setWizard((w) => ({ ...w, step: fn(w.step) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    setStep((s) => Math.min(s + 1, LAST_STEP));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setError("");
    setSubmitting(true);
    const newToken = generateToken();
    try {
      await submitRegistration({ ...wizard.data, memberId: newToken });
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(newToken);
      const continueUrl = `${window.location.origin}/membership/id-card?token=${encodeURIComponent(newToken)}`;
      fetch("/api/termii/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: wizard.data.phone,
          message: `FFFCSL: Registration received! Continue to get your ID card: ${continueUrl} Your token: ${newToken}`,
        }),
      }).catch(() => {
        /* best-effort; the token and link are also shown and copyable on screen */
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "Could not save your registration. Please try again.",
              "Ba a iya ajiye rajistarka ba. Da fatan sake gwadawa."
            )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!hydrated) {
    return null;
  }

  const { step, data } = wizard;

  const steps = [
    <PersonalStep key="0" data={data} update={update} onNext={next} onBack={back} />,
    <AddressFarmStep key="1" data={data} update={update} onNext={next} onBack={back} />,
    <NextOfKinStep key="2" data={data} update={update} onNext={next} onBack={back} />,
    <ConsentStep key="3" data={data} update={update} onNext={finish} onBack={back} />,
  ];

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl">
        <div className="mb-4 flex items-center justify-end">
          <LanguageToggle />
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-9">
          <AnimatePresence mode="wait">
            {!token ? (
              <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <Stepper current={step} labels={REGISTER_STEP_LABELS} hausaLabels={REGISTER_STEP_LABELS_HA} />
                </div>
                {error && <p className="mb-4 text-sm text-terracotta-dark">{error}</p>}
                {submitting ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
                    <Loader2 size={18} className="animate-spin" />
                    {t("Saving your registration...", "Ana ajiye rajistarka...")}
                  </div>
                ) : (
                  steps[step]
                )}
              </motion.div>
            ) : (
              <motion.div
                key="issued"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <KeyRound size={26} />
                </div>
                <h2 className="mt-4 font-serif text-xl font-semibold text-forest-dark">
                  {t("You're Registered", "An Kammala Rajistarka")}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                  {t(
                    "Save this token — you'll need it to continue to ID Card Registration, where you'll pay the ₦2,000 fee and complete your BVN/NIN verification to get your official membership ID card.",
                    "Ajiye wannan lambar shaida — za ka bukace ta don ci gaba zuwa rajistar katin shaida, inda za ka biya kuɗin ₦2,000 kuma ka kammala tabbatar da BVN/NIN ɗinka don samun katin shaidar zama memba."
                  )}
                </p>
                <button
                  type="button"
                  onClick={copyToken}
                  className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-cream-soft px-6 py-4 font-mono text-lg font-semibold text-forest-dark"
                >
                  {token}
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/membership/id-card?token=${encodeURIComponent(token)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark"
                  >
                    {t("Proceed to ID Card Registration", "Ci gaba zuwa Rajistar Katin Shaida")}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}

export function PreRegisterForm() {
  return (
    <LanguageProvider>
      <PreRegisterFormInner />
    </LanguageProvider>
  );
}
