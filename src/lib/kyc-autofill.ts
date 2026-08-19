import type { IdentityRecord } from "@/lib/providers/identity-verifier";
import type { RegistrationData } from "@/types/registration";

function normalizeGender(value?: string): RegistrationData["gender"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "m" || v === "male") return "Male";
  if (v === "f" || v === "female") return "Female";
  return "";
}

function normalizeDob(value?: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

/**
 * Builds a registration-form patch from a verified BVN/NIN record, filling
 * in only the fields the record actually provided and never clobbering a
 * photo the applicant already chose to upload themselves.
 */
export function autofillFromKyc(
  record: IdentityRecord,
  current: RegistrationData
): Partial<RegistrationData> {
  const patch: Partial<RegistrationData> = {};
  if (record.firstName) patch.firstName = record.firstName;
  if (record.lastName) patch.lastName = record.lastName;
  if (record.middleName) patch.otherNames = record.middleName;
  const dob = normalizeDob(record.dateOfBirth);
  if (dob) patch.dob = dob;
  const gender = normalizeGender(record.gender);
  if (gender) patch.gender = gender;
  if (record.photo && current.photoSource !== "upload") {
    patch.photoDataUrl = record.photo;
    patch.photoSource = "kyc";
  }
  return patch;
}
