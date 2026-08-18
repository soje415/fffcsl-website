"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { FieldWrap, TextInput, SelectInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { hyparrowIdentityVerifier } from "@/lib/providers/identity-verifier";
import { STATE_CODES } from "@/lib/ng-locations";
import type { KycType, RegistrationData } from "@/types/registration";

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
  const { t } = useLanguage();
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
      const result = await hyparrowIdentityVerifier.verify({
        type: data.kycType,
        identifier: data.kycNumber,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      if (result.status === "verified") {
        update({
          verificationStatus: "verified",
          memberId: data.memberId || generateMemberId(data.state),
        });
      } else {
        update({ verificationStatus: "mismatch" });
        setReason(
          result.reason ??
            (result.matchedName
              ? t(
                  `The record for that number is registered to "${result.matchedName}".`,
                  `Bayanan wannan lambar suna kan sunan "${result.matchedName}".`
                )
              : t(
                  "Your details do not match the records on file.",
                  "Bayanan ka ba su dace da bayanan da ke rikodin ba."
                ))
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
          <strong>{t("Live identity check.", "Binciken asali na gaskiya.")}</strong>{" "}
          {t(
            "Your details are verified against the National Identity Management Commission (NIN) or your bank's BVN record via Hyparrow. Select one and run the check.",
            "Ana tabbatar da bayanan ka da hukumar kula da asalin ƙasa (NIN) ko rikodin BVN na bankinka ta Hyparrow. Zaɓi ɗaya ka gudanar da bincike."
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Verification Type" hausa="Nau'in tabbatarwa">
          <SelectInput
            required
            value={data.kycType}
            onChange={(e) =>
              update({
                kycType: e.target.value as KycType,
                kycNumber: "",
                verificationStatus: "pending",
              })
            }
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
                  {t(
                    "Your details match the records on file.",
                    "Bayanan ka sun dace da bayanan da ke rikodin."
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
                      "Your details do not match the records on file.",
                      "Bayanan ka ba su dace da bayanan da ke rikodin ba."
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
        onBack={onBack}
        nextType="button"
        onNext={onNext}
        nextDisabled={data.verificationStatus !== "verified"}
        nextLabel={t("Get My Membership ID", "Sami ID na Zama Memba")}
      />
    </div>
  );
}
