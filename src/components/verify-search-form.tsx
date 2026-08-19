"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function VerifySearchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = value.trim();
    if (!id) {
      setError("Enter a Member ID to verify.");
      return;
    }
    setError("");
    router.push(`/verify/${encodeURIComponent(id)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. FFFCSL/LA/000123"
        className="w-full rounded-full border border-line bg-cream-soft px-4 py-2.5 text-center text-sm text-ink outline-none transition-colors focus:border-forest"
      />
      {error && <p className="text-xs text-terracotta-dark">{error}</p>}
      <button
        type="submit"
        className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark"
      >
        Verify Member
      </button>
    </form>
  );
}
