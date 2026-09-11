"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { FieldWrap, TextInput, SelectInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import type { RegistrationData } from "@/types/registration";

export function PersonalStep({
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
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const fromKyc = data.photoSource === "kyc";

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ photoDataUrl: reader.result as string, photoSource: "upload" });
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data.photoDataUrl) {
      setError(t("Please upload a passport photograph.", "Da fatan loda hoton fasfo."));
      return;
    }
    setError("");
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 sm:col-span-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-cream-soft"
          >
            {data.photoDataUrl ? (
              <Image
                src={data.photoDataUrl}
                alt="Passport preview"
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <UserRound size={28} className="text-ink-soft" />
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-forest-dark hover:border-forest/40"
            >
              {fromKyc
                ? t("Upload a Sharper Photo", "Loda hoto mai kyau")
                : data.photoDataUrl
                  ? t("Change Photo", "Canza hoto")
                  : t("Upload Passport Photograph", "Loda hoton fasfo")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
            {fromKyc && (
              <p className="mt-1.5 max-w-sm text-xs text-ink-soft">
                {t(
                  "This photo is from your BVN/NIN record and may be low-resolution. For a sharp, printable ID card, upload a clearer passport photograph.",
                  "Wannan hoton daga bayanan BVN/NIN ɗinka ne kuma yana iya zama marar kyau. Don katin shaida mai kyau da za a iya bugawa, loda hoton fasfo mai kyau."
                )}
              </p>
            )}
            {error && <p className="mt-1.5 text-xs text-terracotta-dark">{error}</p>}
          </div>
        </div>

        <FieldWrap label="First Name" hausa="Suna na farko">
          <TextInput
            required
            value={data.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Last Name / Surname" hausa="Sunan mahaifi">
          <TextInput
            required
            value={data.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap
          label="Other Names"
          hausa="Sauran sunaye"
          hint={t("Optional", "Ba dole ba")}
        >
          <TextInput
            value={data.otherNames}
            onChange={(e) => update({ otherNames: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Date of Birth" hausa="Ranar haihuwa">
          <TextInput
            required
            type="date"
            value={data.dob}
            onChange={(e) => update({ dob: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Gender" hausa="Jinsi">
          <SelectInput
            required
            value={data.gender}
            onChange={(e) => update({ gender: e.target.value as RegistrationData["gender"] })}
          >
            <option value="" disabled>
              {t("Select gender", "Zaɓi jinsi")}
            </option>
            <option value="Male">{t("Male", "Namiji")}</option>
            <option value="Female">{t("Female", "Mace")}</option>
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Marital Status" hausa="Matsayin aure">
          <SelectInput
            required
            value={data.maritalStatus}
            onChange={(e) =>
              update({ maritalStatus: e.target.value as RegistrationData["maritalStatus"] })
            }
          >
            <option value="" disabled>
              {t("Select status", "Zaɓi matsayi")}
            </option>
            <option value="Single">{t("Single", "Mara aure")}</option>
            <option value="Married">{t("Married", "Mai aure")}</option>
            <option value="Divorced">{t("Divorced", "Ya rabu")}</option>
            <option value="Widowed">{t("Widowed", "Gwauruwa/Bazawara")}</option>
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Phone Number" hausa="Lambar waya">
          <TextInput
            required
            type="tel"
            placeholder="080XXXXXXXX"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Email Address" hausa="Adireshin imel">
          <TextInput
            required
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
          />
        </FieldWrap>
      </div>
      <StepNav onBack={onBack} />
    </form>
  );
}
