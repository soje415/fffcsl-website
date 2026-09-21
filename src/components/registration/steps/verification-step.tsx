"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { FieldWrap, TextInput, SelectInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { hyparrowIdentityVerifier, mockIdentityVerifier } from "@/lib/providers/identity-verifier";
import { autofillFromKyc } from "@/lib/kyc-autofill";
import { isDemoMode } from "@/lib/demo-mode";
import type { KycType, RegistrationData } from "@/types/registration";

const identityVerifier = isDemoMode() ? mockIdentityVerifier : hyparrowIdentityVerifier;

export function VerificationStep({
  data,
  update,
  onNext,
  onBack,
}: {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const { t, lang } = useLanguage();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const identifierValid = /^\d{11}$/.test(data.kycNumber);

  async function handleVerify() {
    if (!data.kycType) {
      setError(t("Select BVN or NIN to verify.", "Zaɓi BVN ko NIN don tabbatarwa."));
      return;
    }
    if (!identifierValid) {
      setError(t("The number must be exactly 11 digits.", "Lambar dole ta kasance lambobi 11 daidai."));
      return;
    }
    setError("");
    setReason("");
    setChecking(true);
    try {
      const result = await identityVerifier.verify({
        type: data.kycType,
        identifier: data.kycNumber,
        memberId: data.memberId,
        lang,
      });
      if (result.status === "verified") {
        const patch: Partial<RegistrationData> = {
          verificationStatus: "verified",
          kycType: data.kycType,
          ...(result.record ? autofillFromKyc(result.record, data) : {}),
        };
        update(patch);
      } else {
        update({ verificationStatus: "mismatch" });
        setReason(
          result.reason ??
            t(
              "No record was found for that number. Check it and try again.",
              "Ba a sami bayani kan wannan lambar ba. Duba ta sake gwadawa."
            )
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Verification failed. Please try again.", "Tabbatarwa ta gaza. Da fatan sake gwadawa.")
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm text-forest-dark">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>{t("Now, a live identity check.", "Yanzu, binciken asali na gaskiya.")}</strong>{" "}
          {t(
            "Choose BVN or NIN and we'll look it up with the National Identity Management Commission or your bank via Hyparrow, and cross-check it against the name, date of birth and gender you gave us at registration.",
            "Zaɓi BVN ko NIN, za mu bincika tare da hukumar NIMC ko bankinka ta Hyparrow, sannan mu kwatanta shi da sunanka, ranar haihuwa da jinsin da ka bayar lokacin rajista."
          )}
        </p>
      </div>

      {isDemoMode() && (
        <p className="mt-3 text-xs font-medium text-terracotta-dark">
          {t(
            "Demo mode: any 11-digit number will verify — no real BVN/NIN lookup happens.",
            "Yanayin gwaji: kowace lambar lambobi 11 za ta tabbata — babu ainihin binciken BVN/NIN."
          )}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Verification Type" hausa="Nau'in tabbatarwa">
          <SelectInput
            required
            value={data.kycType}
            onChange={(e) => {
              const type = e.target.value as KycType;
              update({
                kycType: type,
                kycNumber: type === "nin" ? data.nin : type === "bvn" ? data.bvn : "",
                verificationStatus: "pending",
              });
            }}
          >
            <option value="" disabled>
              {t("Select BVN or NIN", "Zaɓi BVN ko NIN")}
            </option>
            <option value="bvn">
              {t("BVN (Bank Verification Number)", "BVN (Lambar tabbatarwa ta banki)")}
            </option>
            <option value="nin">
              {t("NIN (National Identification Number)", "NIN (Lambar asalin ƙasa)")}
            </option>
          </SelectInput>
        </FieldWrap>
        <FieldWrap
          label={data.kycType === "nin" ? "National Identification Number (NIN)" : "Bank Verification Number (BVN)"}
          hausa={data.kycType === "nin" ? "Lambar NIN" : "Lambar BVN"}
        >
          <TextInput
            required
            disabled={!data.kycType}
            inputMode="numeric"
            maxLength={11}
            placeholder={t("11-digit number", "Lambar lambobi 11")}
            value={data.kycNumber}
            onChange={(e) => {
              update({
                kycNumber: e.target.value.replace(/\D/g, ""),
                verificationStatus: "pending",
              });
            }}
          />
        </FieldWrap>
      </div>

      {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}
      {reason && (
        <p className="mt-3 rounded-lg border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta-dark">
          {reason}
        </p>
      )}

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
                <p className="font-semibold">
                  {t("Identity Verified", "An Tabbatar da Asali")}
                </p>
                <p className="text-sm text-ink-soft">
                  {data.firstName
                    ? t(
                        `We found a matching record for ${data.firstName} ${data.lastName}. You're ready to generate your ID card.`,
                        `Mun sami bayani game da ${data.firstName} ${data.lastName} da ya dace. Yanzu za ka iya samar da katin shaidarka.`
                      )
                    : t(
                        "Your record was found. You're ready to generate your ID card.",
                        "An sami bayanan ka. Yanzu za ka iya samar da katin shaidarka."
                      )}
                </p>
              </div>
            </motion.div>
          ) : data.verificationStatus === "mismatch" ? (
            <motion.div
              key="mismatch"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 p-5 text-terracotta-dark"
            >
              <ShieldX size={22} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t("Verification Failed", "Tabbatarwa ta gaza")}</p>
                <p className="text-sm">
                  {reason ||
                    t(
                      "No record was found for that number.",
                      "Ba a sami bayani kan wannan lambar ba."
                    )}
                </p>
                <button
                  type="button"
                  onClick={() => update({ verificationStatus: "pending" })}
                  className="mt-3 text-sm font-medium underline underline-offset-2"
                >
                  {t("Try again", "Sake gwadawa")}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="verify-btn"
              type="button"
              onClick={handleVerify}
              disabled={checking || !data.kycType || !identifierValid}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60"
            >
              {checking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {checking ? t("Running KYC...", "Ana gudanar da KYC...") : t("Run KYC Check", "Gudanar da Binciken KYC")}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <StepNav
        showBack={!!onBack}
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={data.verificationStatus !== "verified"}
        nextLabel={t("Generate My ID Card", "Samar da Katin Shaidata")}
      />
    </div>
  );
}
