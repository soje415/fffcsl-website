import type { RegistrationData } from "@/types/registration";

export async function submitRegistration(data: RegistrationData, lang: "en" | "ha" = "en"): Promise<void> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, lang }),
  });
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(json?.error ?? "Could not save the registration.");
  }
}
