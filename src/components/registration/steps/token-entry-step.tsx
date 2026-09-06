"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import { FieldWrap, TextInput } from "@/components/registration/field";
import { useLanguage } from "@/components/registration/language";
import { EMPTY_REGISTRATION, type RegistrationData } from "@/types/registration";

export function TokenEntryStep({
  initialToken,
  onResolved,
}: {
  initialToken?: string;
  onResolved: (data: RegistrationData) => void;
}) {
  const { t } = useLanguage();
  const [token, setToken] = useState(initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoSubmitted = useRef(false);

  async function lookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("Enter your token number.", "Shigar da lambar shaidarka."));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/register/lookup/${encodeURIComponent(trimmed)}`);
      const json = (await res.json()) as { success: boolean; data?: Partial<RegistrationData>; error?: string };
      if (!res.ok || !json.success || !json.data) {
        setError(
          json.error ??
            t(
              "We couldn't find a pre-registration with that token.",
              "Ba a sami rajista da wannan lambar ba."
            )
        );
        return;
      }
      onResolved({ ...EMPTY_REGISTRATION, ...json.data });
    } catch {
      setError(t("Could not look up that token. Check your connection and try again.", "Ba a iya bincika lambar ba. Duba hanyar sadarwarka ka sake gwadawa."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialToken && !autoSubmitted.current) {
      autoSubmitted.current = true;
      lookup(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm text-forest-dark">
        <KeyRound size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("Continue with your token.", "Ci gaba da lambar shaidarka.")}</strong>{" "}
          {t(
            "Enter the token you received during pre-registration to continue to payment and identity verification.",
            "Shigar da lambar da aka ba ka lokacin rajistar farko don ci gaba zuwa biya da tabbatar da asali."
          )}
        </p>
      </div>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(token);
        }}
      >
        <FieldWrap label="Token Number" hausa="Lambar Shaida">
          <TextInput
            required
            placeholder="FFFCSL/2026/482913"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </FieldWrap>
        {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t("Loading...", "Ana lodawa...") : t("Continue", "Ci gaba")}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        {t("Don't have a token yet?", "Ba ka da lambar shaida tukuna?")}{" "}
        <Link href="/membership/register" className="font-medium text-forest-dark underline underline-offset-2">
          {t("Pre-register here", "Fara rajista a nan")}
        </Link>
      </p>
    </div>
  );
}
