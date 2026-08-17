"use client";

import { useMemo, type FormEvent } from "react";
import { FieldWrap, TextInput, SelectInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import { NG_STATES, getLgas } from "@/lib/ng-locations";
import type { RegistrationData } from "@/types/registration";

const CROPS = [
  "Rice",
  "Maize",
  "Wheat",
  "Vegetables",
  "Legumes (Beans/Cowpea)",
  "Cassava",
  "Yam",
  "Sorghum",
  "Millet",
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
  const lgas = useMemo(() => (data.state ? getLgas(data.state) : []), [data.state]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Residential Address" className="sm:col-span-2">
          <textarea
            required
            rows={3}
            value={data.residentialAddress}
            onChange={(e) => update({ residentialAddress: e.target.value })}
            className="w-full resize-none rounded-lg border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest"
          />
        </FieldWrap>
        <FieldWrap label="State">
          <SelectInput
            required
            value={data.state}
            onChange={(e) => update({ state: e.target.value, lga: "" })}
          >
            <option value="" disabled>
              Select state
            </option>
            {NG_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Local Government Area">
          <SelectInput
            required
            disabled={!data.state}
            value={data.lga}
            onChange={(e) => update({ lga: e.target.value })}
          >
            <option value="" disabled>
              {data.state ? "Select LGA" : "Select a state first"}
            </option>
            {lgas.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Community / Ward" hint="Optional">
          <TextInput
            value={data.community}
            onChange={(e) => update({ community: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Farmer Cluster / Cooperative Group" hint="Optional">
          <TextInput
            value={data.cluster}
            onChange={(e) => update({ cluster: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Primary Crop">
          <SelectInput
            required
            value={data.primaryCrop}
            onChange={(e) => update({ primaryCrop: e.target.value })}
          >
            <option value="" disabled>
              Select primary crop
            </option>
            {CROPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Farm Size (Hectares)">
          <TextInput
            required
            type="number"
            min="0"
            step="0.1"
            value={data.farmSizeHectares}
            onChange={(e) => update({ farmSizeHectares: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Years Farming">
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
