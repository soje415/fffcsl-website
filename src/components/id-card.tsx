import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import logoIcon from "@/assets/brand/logo-icon.jpeg";
import type { RegistrationData } from "@/types/registration";

export function IdCard({ data }: { data: RegistrationData }) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${encodeURIComponent(data.memberId)}`
      : `https://fffcsl.org.ng/verify/${encodeURIComponent(data.memberId)}`;

  const issued = new Date();
  const expires = new Date(issued);
  expires.setFullYear(expires.getFullYear() + 2);
  const memberSince = issued.getFullYear();

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
      {/* Front */}
      <div className="id-card relative flex aspect-[340/214] w-[min(340px,88vw)] shrink-0 flex-col overflow-hidden rounded-2xl border border-forest-dark bg-forest-dark text-cream shadow-md">
        <Image
          src={logoIcon}
          alt=""
          className="pointer-events-none absolute -right-10 -top-6 h-auto w-40 rotate-6 opacity-[0.08] mix-blend-luminosity"
        />

        <div className="relative flex items-center gap-2 border-b border-cream/15 bg-black/10 px-4 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={logoIcon}
              alt=""
              className="h-6 w-auto object-contain"
            />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-base font-extrabold tracking-wide text-cream">
              FFFCSL
            </p>
            <p className="truncate text-[7px] tracking-wide text-cream/70">
              FEDERATION OF FADAMA FARMERS COOPERATIVE SOCIETY LTD.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-[7px] font-bold uppercase tracking-wide text-ink">
            Member
          </span>
        </div>

        <div className="relative flex flex-1 gap-3 px-4 py-2.5">
          <div className="h-[68px] w-[56px] shrink-0 overflow-hidden rounded-md border-2 border-cream/70 bg-cream/10">
            {data.photoDataUrl && (
              <Image
                src={data.photoDataUrl}
                alt=""
                width={56}
                height={68}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-cream">
              {data.firstName} {data.lastName}
            </p>
            <p className="text-[7.5px] uppercase tracking-wide text-amber">
              Registered Farmer
            </p>

            <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5 text-[7px] text-cream/85">
              <span className="text-cream/50">ID</span>
              <span className="truncate font-mono font-semibold text-cream">
                {data.memberId}
              </span>
              <span className="text-cream/50">Chapter</span>
              <span className="truncate">
                {data.state} &middot; {data.lga}
              </span>
              <span className="text-cream/50">Commodity</span>
              <span className="truncate">{data.primaryCrop || "—"}</span>
              <span className="text-cream/50">Member Since</span>
              <span>{memberSince}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center justify-between self-stretch">
            <div className="rounded-md bg-white p-1">
              <QRCodeSVG value={verifyUrl} size={42} fgColor="#123a20" />
            </div>
            <p className="text-center text-[6px] leading-tight text-cream/60">
              Valid till
              <br />
              {expires.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-cream/15 bg-black/10 px-4 py-1.5">
          <p className="text-[6.5px] text-cream/70">
            Registered: Federal Dept. of Cooperatives, Nigeria
          </p>
          <p className="text-[6.5px] font-medium text-cream/70">
            fffcsl.org.ng
          </p>
        </div>
      </div>

      {/* Back */}
      <div className="id-card relative flex aspect-[340/214] w-[min(340px,88vw)] shrink-0 flex-col overflow-hidden rounded-2xl border border-forest-dark bg-forest-dark p-4 text-cream shadow-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(253,248,239,0.5) 0px, rgba(253,248,239,0.5) 1.5px, transparent 1.5px, transparent 4px)",
          }}
        />

        <div className="relative">
          <p className="text-[9px] font-bold uppercase tracking-wide text-amber">
            Terms &amp; Conditions
          </p>
          <p className="mt-1 text-[7px] leading-relaxed text-cream/80">
            This card certifies that the bearer is a registered member of the
            Federation of Fadama Farmers Cooperative Society Ltd (FFFCSL). It
            remains the property of FFFCSL, is non-transferable, and must be
            surrendered on request. Report loss immediately to any FFFCSL
            office. If found, please return to the nearest FFFCSL office.
          </p>
        </div>

        <div className="relative mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-cream/15 pt-2 text-[7px] text-cream/80">
          <p>
            <span className="text-cream/50">Farm Size:</span>{" "}
            {data.farmSizeHectares || "—"} ha
          </p>
          <p>
            <span className="text-cream/50">Years Farming:</span>{" "}
            {data.yearsFarming || "—"}
          </p>
          <p className="col-span-2">
            <span className="text-cream/50">Next of Kin:</span> {data.nokName}{" "}
            ({data.nokRelationship})
          </p>
        </div>

        <div className="relative mt-auto flex items-end justify-between">
          <div className="text-[7px] text-cream/70">
            <p>info@fffcsl.org.ng</p>
            <p>+234 (0) 000 000 0000</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="h-5 w-16 border-b border-cream/40" />
              <p className="mt-0.5 text-[6px] text-cream/60">
                Authorized Signature
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-amber/70 text-center">
              <span className="text-[5.5px] font-bold uppercase leading-tight text-amber">
                FFFCSL
                <br />
                Official
                <br />
                Seal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
