import { Fragment } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { UserRound } from "lucide-react";
import logoIcon from "@/assets/brand/logo-icon.jpeg";
import type { RegistrationData } from "@/types/registration";

function formatDob(dob: string): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function genderAbbrev(gender: RegistrationData["gender"]): string {
  if (gender === "Male") return "M";
  if (gender === "Female") return "F";
  return "—";
}

// A faint diagonal hatch, matched to the back's security pattern, to give
// the printed card body a guilloché-style anti-tamper texture.
function SecurityPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(253,248,239,0.5) 0px, rgba(253,248,239,0.5) 1.5px, transparent 1.5px, transparent 4px)",
      }}
    />
  );
}

export function IdCardFront({
  data,
  expires,
}: {
  data: RegistrationData;
  expires?: Date;
}) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${encodeURIComponent(data.memberId)}`
      : `https://fadamacooperative.com/verify/${encodeURIComponent(data.memberId)}`;

  const defaultExpires = new Date();
  defaultExpires.setFullYear(defaultExpires.getFullYear() + 2);
  const resolvedExpires = expires ?? defaultExpires;

  const fields = [
    { label: "ID", value: data.memberId, mono: true },
    { label: "DOB", value: formatDob(data.dob) },
    { label: "Sex", value: genderAbbrev(data.gender) },
    { label: "Chapter", value: `${data.state || "—"} · ${data.lga || "—"}` },
  ];

  return (
    <>
      {/* Front */}
      <div className="id-card relative flex aspect-[340/214] w-[min(340px,88vw)] shrink-0 flex-col overflow-hidden rounded-2xl border border-forest-dark bg-forest-dark text-cream shadow-md">
        <Image
          src={logoIcon}
          alt=""
          className="pointer-events-none absolute -right-10 -top-6 h-auto w-40 rotate-6 opacity-[0.08] mix-blend-luminosity"
        />

        <div className="relative flex items-center gap-2 border-b border-cream/15 bg-black/10 px-4 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={logoIcon}
              alt=""
              className="h-5 w-auto object-contain"
            />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] font-extrabold tracking-wide text-cream">
              FFFCSL
            </p>
            <p className="text-[6.5px] leading-snug tracking-wide text-cream/70">
              FEDERATION OF FADAMA FARMERS COOPERATIVE SOCIETY LTD.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-[7px] font-bold uppercase tracking-wide text-ink">
            Member
          </span>
        </div>

        <div className="relative flex flex-1 items-stretch">
          <SecurityPattern />

          <div className="relative flex w-[86px] shrink-0 items-center justify-center border-r border-cream/15 bg-black/10 p-2">
            <div className="flex h-[84px] w-[68px] items-center justify-center overflow-hidden rounded-sm border-2 border-cream/70 bg-cream/10">
              {data.photoDataUrl ? (
                <Image
                  src={data.photoDataUrl}
                  alt=""
                  width={68}
                  height={84}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={28} className="text-cream/30" />
              )}
            </div>
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-3 px-3 py-2 text-left">
            {data.photoDataUrl && (
              <div
                aria-hidden
                className="pointer-events-none absolute -right-2 top-0 h-full w-16 opacity-[0.16] mix-blend-luminosity"
              >
                <Image
                  src={data.photoDataUrl}
                  alt=""
                  width={64}
                  height={140}
                  className="h-full w-full grayscale object-cover object-top"
                />
              </div>
            )}
            <div className="relative">
              <p className="truncate font-serif text-[14px] font-bold leading-tight text-cream">
                {data.firstName} {data.lastName}
              </p>
              <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.15em] text-amber">
                Registered Farmer
              </p>
            </div>

            <div className="relative grid grid-cols-[auto_1fr] items-baseline gap-x-2.5 gap-y-1.5 text-[7.5px] text-cream/85">
              {fields.map((f) => (
                <Fragment key={f.label}>
                  <span className="text-[6.5px] uppercase tracking-wide text-cream/50">
                    {f.label}
                  </span>
                  <span
                    className={`truncate text-left font-semibold text-cream ${f.mono ? "font-mono tracking-tight" : ""}`}
                  >
                    {f.value}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="relative flex w-[72px] shrink-0 flex-col items-center justify-between border-l border-cream/15 px-2 py-2.5 text-center">
            <div className="rounded-md bg-white p-1">
              <QRCodeSVG value={verifyUrl} size={44} fgColor="#123a20" />
            </div>
            <div>
              <p className="text-[6px] leading-tight text-cream/60">Valid till</p>
              <p className="text-[7px] font-semibold leading-tight text-cream">
                {resolvedExpires.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-cream/15 bg-black/10 px-4 py-1.5">
          <p className="text-[6.5px] text-cream/70">
            Registered: Federal Dept. of Cooperatives, Nigeria
          </p>
          <p className="text-[6.5px] font-medium text-cream/70">
            fadamacooperative.com
          </p>
        </div>
      </div>
    </>
  );
}

function IdCardBack({ data }: { data: RegistrationData }) {
  return (
    <>
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

        {/* Microprint band — a repeating fine-print line real ID printers
            use because it degrades into an illegible smear on photocopiers
            and low-DPI scans, unlike the rest of the card. */}
        <p
          aria-hidden
          className="relative mt-2 overflow-hidden truncate whitespace-nowrap border-y border-cream/10 py-1 text-[4px] font-semibold uppercase leading-none tracking-[0.2em] text-cream/35"
        >
          {Array(12).fill(`FFFCSL ${data.memberId} AUTHENTIC MEMBER`).join(" • ")}
        </p>

        <div className="relative mt-auto flex items-end justify-between">
          <div className="text-[7px] text-cream/70">
            <p>+234 (0) 904 324 0455</p>
          </div>
          <div className="text-right">
            <div className="h-5 w-16 border-b border-cream/40" />
            <p className="mt-0.5 text-[6px] text-cream/60">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function IdCard({ data }: { data: RegistrationData }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
      <IdCardFront data={data} />
      <IdCardBack data={data} />
    </div>
  );
}
