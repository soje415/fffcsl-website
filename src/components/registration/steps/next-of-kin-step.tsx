"use client";

import type { FormEvent } from "react";
import { FieldWrap, TextInput } from "@/components/registration/field";
import { StepNav } from "@/components/registration/step-nav";
import type { RegistrationData } from "@/types/registration";

export function NextOfKinStep({
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
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrap label="Next of Kin Full Name" className="sm:col-span-2">
          <TextInput
            required
            value={data.nokName}
            onChange={(e) => update({ nokName: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Relationship">
          <TextInput
            required
            placeholder="e.g. Spouse, Sibling, Parent"
            value={data.nokRelationship}
            onChange={(e) => update({ nokRelationship: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap label="Phone Number">
          <TextInput
            required
            type="tel"
            value={data.nokPhone}
            onChange={(e) => update({ nokPhone: e.target.value })}
          />
        </FieldWrap>
      </div>
      <StepNav onBack={onBack} />
    </form>
  );
}
