export type Registration = {
  memberId: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  phone: string;
  email: string;
  nin: string;
  bvn: string;
  residentialAddress: string;
  state: string;
  lga: string;
  community: string;
  cluster: string;
  farmSizeHectares: string;
  yearsFarming: string;
  nokName: string;
  nokRelationship: string;
  nokPhone: string;
  crops: string[];
  photoDataUrl: string;
  consent: boolean;
};

type Result = { ok: true; value: Registration } | { ok: false; error: string };

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

class Invalid extends Error {}

function text(raw: unknown, label: string, max: number, required = false): string {
  const value = (typeof raw === "string" ? raw : raw == null ? "" : String(raw))
    .replace(CONTROL_CHARS, " ")
    .trim();
  if (required && !value) throw new Invalid(`${label} is required.`);
  if (value.length > max) throw new Invalid(`${label} is too long.`);
  return value;
}

function name(raw: unknown, label: string, required: boolean): string {
  const value = text(raw, label, 100, required);
  if (value && !NAME_RE.test(value)) throw new Invalid(`${label} contains invalid characters.`);
  return value;
}

/** Canonical Nigerian mobile format: 0XXXXXXXXXX. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return `0${digits.slice(3)}`;
  if (digits.length === 10) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return digits;
  return null;
}

function phone(raw: unknown, label: string, required: boolean): string {
  const value = text(raw, label, 20, required);
  if (!value) return "";
  const normalized = normalizePhone(value);
  if (!normalized) throw new Invalid(`Enter a valid Nigerian phone number for ${label.toLowerCase()}.`);
  return normalized;
}

/** Next-of-kin numbers may be foreign or oddly formatted, so only sanity-check the digit count. */
function looseNumber(raw: unknown, label: string): string {
  const value = text(raw, label, 25);
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length < 7 || digits.length > 15) throw new Invalid(`${label} is not a valid number.`);
  return value.startsWith("+") ? `+${digits}` : digits;
}

function email(raw: unknown): string {
  const value = text(raw, "Email", 254).toLowerCase();
  if (!value) return "";
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(value)) throw new Invalid("Enter a valid email address.");
  return value;
}

function eleven(raw: unknown, label: string): string {
  const value = text(raw, label, 11);
  if (value && !/^\d{11}$/.test(value)) throw new Invalid(`${label} must be exactly 11 digits.`);
  return value;
}

function dob(raw: unknown): string {
  const value = text(raw, "Date of birth", 10);
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Invalid("Date of birth is invalid.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Invalid("Date of birth is invalid.");
  }
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  if (age < 10 || age > 110) throw new Invalid("Date of birth is not plausible.");
  return value;
}

function oneOf(raw: unknown, label: string, allowed: readonly string[]): string {
  const value = text(raw, label, 20);
  if (value && !allowed.includes(value)) throw new Invalid(`${label} is invalid.`);
  return value;
}

function decimal(raw: unknown, label: string, pattern: RegExp): string {
  const value = text(raw, label, 10);
  if (value && !pattern.test(value)) throw new Invalid(`${label} is invalid.`);
  return value;
}

export function validateRegistration(input: Record<string, unknown>): Result {
  try {
    const crops = Array.isArray(input.crops) ? input.crops : [];
    if (crops.length > 30) throw new Invalid("Too many crops selected.");
    const cleanCrops = [...new Set(crops.map((c) => text(c, "Crop", 60)).filter(Boolean))];

    const photo = typeof input.photoDataUrl === "string" ? input.photoDataUrl : "";

    return {
      ok: true,
      value: {
        memberId: text(input.memberId, "Token", 40, true),
        firstName: name(input.firstName, "First name", true),
        lastName: name(input.lastName, "Last name", true),
        otherNames: name(input.otherNames, "Other names", false),
        dob: dob(input.dob),
        gender: oneOf(input.gender, "Gender", ["Male", "Female"]),
        maritalStatus: oneOf(input.maritalStatus, "Marital status", ["Single", "Married", "Divorced", "Widowed"]),
        phone: phone(input.phone, "Phone number", true),
        email: email(input.email),
        nin: eleven(input.nin, "NIN"),
        bvn: eleven(input.bvn, "BVN"),
        residentialAddress: text(input.residentialAddress, "Address", 300),
        state: text(input.state, "State", 60),
        lga: text(input.lga, "LGA", 80),
        community: text(input.community, "Community", 100),
        cluster: text(input.cluster, "Cluster", 100),
        farmSizeHectares: decimal(input.farmSizeHectares, "Farm size", /^\d{1,5}(\.\d{1,2})?$/),
        yearsFarming: decimal(input.yearsFarming, "Years farming", /^\d{1,2}$/),
        nokName: name(input.nokName, "Next of kin name", false),
        nokRelationship: text(input.nokRelationship, "Next of kin relationship", 60),
        nokPhone: looseNumber(input.nokPhone, "Next of kin phone"),
        crops: cleanCrops,
        photoDataUrl: photo,
        consent: input.consentData === true,
      },
    };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: err.message };
    throw err;
  }
}
