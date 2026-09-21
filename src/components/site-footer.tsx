import Link from "next/link";
import Image from "next/image";
import logoIcon from "@/assets/brand/logo-icon.jpeg";
import { SocialLinks } from "@/components/social-links";

const EXPLORE_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/departments", label: "Departments" },
  { href: "/youth-and-women", label: "Youth & Women" },
  { href: "/partnerships", label: "Partnerships" },
];

const MEMBER_LINKS = [
  { href: "/membership", label: "Become a Member" },
  { href: "/portal", label: "Member Login" },
  { href: "/verify", label: "Verify a Member ID" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-dark text-cream/90">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-cream/30">
                <Image
                  src={logoIcon}
                  alt="FFFCSL logo"
                  className="h-12 w-auto object-contain"
                />
              </span>
              <div>
                <p className="font-serif text-base font-semibold text-cream">
                  FFFCSL
                </p>
                <p className="text-xs text-cream/70">
                  Federation of Fadama Farmers Cooperative Society Ltd.
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              A nationally registered apex farmers&apos; cooperative, duly
              registered under the Federal Department of Cooperatives,
              Federal Ministry of Agriculture and Food Security, Nigeria &mdash;
              organizing and empowering farmers across all 36 states and the FCT.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-cream">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-cream/70 transition-colors hover:text-amber"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-cream">Membership</p>
            <ul className="mt-4 space-y-2.5">
              {MEMBER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-cream/70 transition-colors hover:text-amber"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Federation of Fadama Farmers
            Cooperative Society Ltd. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <span>Registered under the Federal Department of Cooperatives, Nigeria.</span>
            <span aria-hidden className="text-cream/30">
              &middot;
            </span>
            <Link href="/admin" prefetch={false} className="text-cream/40 transition-colors hover:text-cream/70">
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
