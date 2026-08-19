"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FieldWrap, TextInput, SelectInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { useLanguage } from "@/components/registration/language";
import { NG_STATES, getLgas } from "@/lib/ng-locations";
import { generateMemberId } from "@/lib/member-id";
import type { RegistrationData } from "@/types/registration";

const CROPS = [
  "Rice",
  "Maize",
  "Wheat",
  "Cassava",
  "Yam",
  "Sweet Potato",
  "Irish Potato",
  "Cocoyam",
  "Sorghum",
  "Millet",
  "Cowpea (Beans)",
  "Soybean",
  "Groundnut",
  "Sesame (Beniseed)",
  "Melon (Egusi)",
  "Tomato",
  "Pepper",
  "Onion",
  "Okra",
  "Garden Egg",
  "Vegetables (Leafy)",
  "Plantain",
  "Banana",
  "Cocoa",
  "Oil Palm",
  "Cashew",
  "Sugarcane",
  "Cotton",
  "Ginger",
  "Kolanut",
  "Mango",
  "Citrus (Orange/Lime)",
  "Pineapple",
  "Other",
];

export function AddressFarmStep({
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
  const [cropError, setCropError] = useState("");
  const lgas = useMemo(() => (data.state ? getLgas(data.state) : []), [data.state]);

  function toggleCrop(crop: string) {
    setCropError("");
    const next = data.crops.includes(crop)
      ? data.crops.filter((c) => c !== crop)
      : [...data.crops, crop];
    update({ crops: next });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (data.crops.length === 0) {
      setCropError(t("Select at least one primary crop.", "Zaɓi aƙalla amfanin gona guda."));
      return;
    }
    if (!data.memberId) {
      update({ memberId: generateMemberId(data.state) });
    }
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Residential Address" hausa="Adireshin gida" className="sm:col-span-2">
          <textarea
            required
            rows={3}
            value={data.residentialAddress}
            onChange={(e) => update({ residentialAddress: e.target.value })}
            className="w-full resize-none rounded-lg border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest"
          />
        </FieldWrap>
        <FieldWrap label="State" hausa="Jiha">
          <SelectInput
            required
            value={data.state}
            onChange={(e) => update({ state: e.target.value, lga: "" })}
          >
            <option value="" disabled>
              {t("Select state", "Zaɓi jiha")}
            </option>
            {NG_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Local Government Area" hausa="Karamar hukuma">
          <SelectInput
            required
            disabled={!data.state}
            value={data.lga}
            onChange={(e) => update({ lga: e.target.value })}
          >
            <option value="" disabled>
              {data.state
                ? t("Select LGA", "Zaɓi karamar hukuma")
                : t("Select a state first", "Fara zaɓi jiha")}
            </option>
            {lgas.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Community / Ward" hausa="Unguwa">
          <TextInput
            required
            value={data.community}
            onChange={(e) => update({ community: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap
          label="Farmer Cluster"
          hausa="Rukunin manoma"
          hint={t("Optional", "Ba dole ba")}
        >
          <TextInput
            value={data.cluster}
            onChange={(e) => update({ cluster: e.target.value })}
          />
        </FieldWrap>

        <FieldWrap label="Primary Crop(s)" hausa="Amfanin gona" className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CROPS.map((crop) => {
              const selected = data.crops.includes(crop);
              return (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-forest bg-forest/10 text-forest-dark"
                      : "border-line bg-cream text-ink-soft hover:border-forest/40"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected ? "border-forest bg-forest text-cream" : "border-line bg-white"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                        <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </span>
                  {crop === "Other" ? t("Other", "Sauran") : crop}
                </button>
              );
            })}
          </div>
          {cropError ? (
            <span className="text-xs text-terracotta-dark">{cropError}</span>
          ) : (
            <span className="text-xs text-ink-soft/70">
              {t("Select all that apply.", "Zaɓi duk waɗanda suka dace.")}
            </span>
          )}
        </FieldWrap>

        <FieldWrap label="Farm Size (Hectares)" hausa="Girman gona (Hectare)">
          <TextInput
            required
            type="number"
            min="0"
            step="0.1"
            value={data.farmSizeHectares}
            onChange={(e) => update({ farmSizeHectares: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Years Farming" hausa="Shekarun noma">
          <TextInput
            required
            type="number"
            min="0"
            value={data.yearsFarming}
            onChange={(e) => update({ yearsFarming: e.target.value })}
          />
        </FieldWrap>
      </div>
      <StepNav onBack={onBack} />
    </form>
  );
}
