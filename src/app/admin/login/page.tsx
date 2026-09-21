"use client";

import { useRef, useState } from "react";
import { Container } from "@/components/ui/container";

export default function AdminLoginPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function sanitizeInput(e: React.FormEvent<HTMLInputElement>) {
    const cleaned = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
    if (cleaned !== e.currentTarget.value) e.currentTarget.value = cleaned;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pin = inputRef.current?.value ?? "";
    if (pin.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Incorrect PIN.");
        return;
      }
      // Full navigation, not router.replace: the footer's prefetched /admin
      // link can leave a cached redirect-to-login in the client router cache,
      // which would bounce a freshly logged-in admin straight back here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-sm">
        <div className="rounded-2xl border border-line bg-white p-8">
          <h1 className="font-serif text-xl font-semibold text-ink">Admin Login</h1>
          <p className="mt-1 text-sm text-ink-soft">Enter the 6-digit admin PIN.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {/* Uncontrolled on purpose: a controlled input tied to React state
                can be wiped by hydration if someone types before the page
                finishes hydrating (the DOM value resets to the initial empty
                state). A ref reads whatever's actually in the field. */}
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              autoComplete="off"
              name="admin-pin"
              defaultValue=""
              onInput={sanitizeInput}
              className="w-full rounded-lg border border-line bg-cream-soft px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-forest"
              placeholder="••••••"
            />
            {error ? <p className="text-sm text-terracotta-dark">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
