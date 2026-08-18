"use client";

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/registration/language";

const controlClass =
  "w-full rounded-lg border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest disabled:cursor-not-allowed disabled:opacity-60";

export function FieldWrap({
  label,
  hausa,
  hint,
  hintHausa,
  className,
  children,
}: {
  label: string;
  hausa?: string;
  hint?: string;
  hintHausa?: string;
  className?: string;
  children: ReactNode;
}) {
  const { lang } = useLanguage();
  const displayLabel = lang === "ha" && hausa ? hausa : label;
  const displayHint =
    lang === "ha" && hintHausa ? hintHausa : hint;
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-ink-soft">{displayLabel}</span>
      {children}
      {displayHint && (
        <span className="text-xs text-ink-soft/70">{displayHint}</span>
      )}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, className)} {...props}>
      {children}
    </select>
  );
}
