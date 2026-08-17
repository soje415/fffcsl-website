import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to your FFFCSL member profile.",
};

export default function PortalPage() {
  return (
    <>
      <PageHero
        eyebrow="Member Portal"
        title="Sign In to Your FFFCSL Profile"
        description="View your membership status and download or print your ID card."
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-md">
          <Reveal className="rounded-2xl border border-line bg-white p-8">
            <form className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-ink-soft">
                  Email or Phone Number
                </label>
                <input
                  disabled
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-line bg-cream-soft px-4 py-2.5 text-sm text-ink-soft outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">
                  Password
                </label>
                <input
                  disabled
                  type="password"
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-lg border border-line bg-cream-soft px-4 py-2.5 text-sm text-ink-soft outline-none"
                />
              </div>
              <button
                disabled
                className="mt-2 rounded-full bg-forest/40 px-6 py-3 text-sm font-semibold text-cream"
              >
                Sign In
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              The member portal unlocks once{" "}
              <Link href="/membership" className="font-medium text-forest-dark underline underline-offset-2">
                registration
              </Link>{" "}
              opens.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
