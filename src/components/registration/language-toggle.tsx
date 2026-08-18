"use client";

import { useLanguage, type Language } from "@/components/registration/language";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ha", label: "HA" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLang(option.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors ${
            lang === option.value
              ? "bg-forest text-cream"
              : "text-ink-soft hover:text-forest-dark"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
