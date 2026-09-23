import type { Metadata } from "next";
import { Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Federation of Fadama Farmers Cooperative Society Ltd.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="Get in Touch with FFFCSL"
        description="For membership enquiries, partnership proposals, or general questions about the Federation."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <h2 className="font-serif text-xl font-semibold text-forest-dark">
              National Headquarters
            </h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-forest" />
                <p className="text-sm leading-relaxed text-ink-soft">
                  Federation of Fadama Farmers Cooperative Society Ltd.
                  <br />
                  National Secretariat, Nigeria
                  <span className="mt-1 block text-xs text-ink-soft/70">
                    (Full address to be confirmed)
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-forest" />
                <p className="text-sm text-ink-soft">
                  +234 (0) 904 324 0455
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="rounded-2xl border border-line bg-white p-7 sm:p-8">
              <h2 className="font-serif text-xl font-semibold text-forest-dark">
                Send Us a Message
              </h2>
              <ContactForm />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
