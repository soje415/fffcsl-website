"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      router.replace("/admin");
      router.refresh();
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
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-line bg-cream-soft px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-forest"
              placeholder="••••••"
            />
            {error ? <p className="text-sm text-terracotta-dark">{error}</p> : null}
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
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
