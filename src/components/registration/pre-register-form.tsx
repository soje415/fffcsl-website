"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, Loader2, KeyRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FieldWrap, TextInput } from "@/components/registration/field";
import { LanguageProvider, useLanguage } from "@/components/registration/language";
import { LanguageToggle } from "@/components/registration/language-toggle";
import { generateToken } from "@/lib/member-id";
import { submitRegistration } from "@/lib/providers/registration-provider";
import { EMPTY_REGISTRATION } from "@/types/registration";

function PreRegisterFormInner() {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const newToken = generateToken();
    try {
      await submitRegistration({
        ...EMPTY_REGISTRATION,
        memberId: newToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setToken(newToken);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not save your pre-registration. Please try again.", "Ba a iya ajiye rajistarka ba. Da fatan sake gwadawa.")
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

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl">
        <div className="mb-4 flex items-center justify-end">
          <LanguageToggle />
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-9">
          <AnimatePresence mode="wait">
            {!token ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
              >
                <p className="text-sm text-ink-soft">
                  {t(
                    "Give us your name and phone number and we'll issue you a token. Use it to come back and complete your ID card registration and payment.",
                    "Ba mu suna da lambar wayarka, za mu ba ka lambar shaida. Ka yi amfani da ita ka dawo ka gama rajistar katin shaida da biya."
                  )}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldWrap label="First Name" hausa="Suna na farko">
                    <TextInput
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </FieldWrap>
                  <FieldWrap label="Last Name / Surname" hausa="Sunan mahaifi">
                    <TextInput
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </FieldWrap>
                  <FieldWrap label="Phone Number" hausa="Lambar waya">
                    <TextInput
                      required
                      type="tel"
                      placeholder="080XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </FieldWrap>
                  <FieldWrap label="Email Address" hausa="Adireshin imel">
                    <TextInput
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FieldWrap>
                </div>
                {error && <p className="mt-4 text-sm text-terracotta-dark">{error}</p>}
                <div className="mt-8 flex justify-end border-t border-line pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting
                      ? t("Saving...", "Ana ajiyewa...")
                      : t("Get My Token", "Sami Lambar Shaida")}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                </div>
              </motion.form>
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
                  {t("You're Pre-Registered", "An Fara Rajistarka")}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                  {t(
                    "Save this token — you'll need it to continue to ID Card Registration, where you'll pay the ₦2,000 fee and complete your BVN/NIN verification.",
                    "Ajiye wannan lambar shaida — za ka bukace ta don ci gaba zuwa rajistar katin shaida, inda za ka biya kuɗin ₦2,000 kuma ka kammala tabbatar da BVN/NIN ɗinka."
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
