"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/brand/logo-icon.jpeg";

const NAV_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/departments", label: "Departments" },
  { href: "/youth-and-women", label: "Youth & Women" },
  { href: "/partnerships", label: "Partnerships" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-line sm:h-16 sm:w-16">
            <Image
              src={logoIcon}
              alt="FFFCSL logo"
              className="h-11 w-auto object-contain sm:h-12"
              priority
            />
          </span>
          <span className="hidden flex-col leading-tight md:flex">
            <span className="font-serif text-base font-semibold tracking-tight text-forest-dark">
              FFFCSL
            </span>
            <span className="max-w-[15rem] text-[11px] leading-snug text-ink-soft">
              Federation of Fadama Farmers Cooperative Society Ltd.
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center xl:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-cream-soft hover:text-forest-dark",
                  active && "bg-cream-soft text-forest-dark"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <Link
            href="/portal"
            className="whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-forest-dark"
          >
            Member Login
          </Link>
          <Link
            href="/membership"
            className="whitespace-nowrap rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-cream shadow-sm shadow-forest/20 transition-colors hover:bg-forest-dark"
          >
            Become a Member
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-forest-dark xl:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-line bg-cream xl:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream-soft hover:text-forest-dark"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
                <Link
                  href="/portal"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3.5 py-2.5 text-center text-sm font-medium text-ink-soft hover:text-forest-dark"
                >
                  Member Login
                </Link>
                <Link
                  href="/membership"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-cream hover:bg-forest-dark"
                >
                  Become a Member
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
