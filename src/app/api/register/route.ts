import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-mode";
import { parseLang, smsRegistered } from "@/lib/notify";
import {
  NEW_MEMBER_ID_RE,
  badRequest,
  clientIp,
  crossOriginBlocked,
  rateLimit,
  readJson,
  serverError,
} from "@/lib/security";
import { PhotoError, deletePhoto, parsePhotoDataUrl, uploadPhoto, type ParsedPhoto } from "@/lib/storage";
import { validateRegistration } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Room for one base64 passport photo (capped at 2 MB decoded) plus the form fields.
const MAX_BODY_BYTES = 3_500_000;

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  try {
    const body = await readJson(req, MAX_BODY_BYTES);
    if (body.error) return body.error;

    const checked = validateRegistration(body.data);
    if (!checked.ok) return badRequest(checked.error);
    const v = checked.value;
    const lang = parseLang(body.data.lang);

    let photo: ParsedPhoto | null = null;
    if (v.photoDataUrl) {
      try {
        photo = parsePhotoDataUrl(v.photoDataUrl);
      } catch (err) {
        if (err instanceof PhotoError) return badRequest(err.message);
        throw err;
      }
    }

    await ensureSchema();
    const db = sql();
    const existing = await db`SELECT verification_status, photo FROM farmers WHERE member_id = ${v.memberId}`;

    // ── New pre-registration ────────────────────────────────────────────
    if (existing.length === 0) {
      if (!NEW_MEMBER_ID_RE.test(v.memberId)) return badRequest("Invalid token.");
      if (!v.consent) return badRequest("Consent is required to register.");

      const limited = await rateLimit("register-create", clientIp(req), 60, 3600);
      if (limited) return limited;

      let photoKey = "";
      if (photo) {
        try {
          photoKey = await uploadPhoto(v.memberId, photo);
        } catch (err) {
          return serverError("register:photo", err, "Could not save your photo. Please try again.");
        }
      }

      const inserted = await db`
        INSERT INTO farmers (
          member_id, first_name, last_name, other_names, dob, gender, marital_status,
          phone, email, nin, bvn, photo, residential_address, state, lga, community, cluster,
          farm_size_hectares, years_farming, nok_name, nok_relationship, nok_phone,
          verification_status, consent_at
        ) VALUES (
          ${v.memberId}, ${v.firstName}, ${v.lastName}, ${v.otherNames}, ${v.dob},
          ${v.gender}, ${v.maritalStatus}, ${v.phone}, ${v.email}, ${v.nin}, ${v.bvn},
          ${photoKey}, ${v.residentialAddress}, ${v.state}, ${v.lga}, ${v.community}, ${v.cluster},
          ${v.farmSizeHectares}, ${v.yearsFarming}, ${v.nokName}, ${v.nokRelationship}, ${v.nokPhone},
          'pending', now()
        )
        ON CONFLICT (member_id) DO NOTHING
        RETURNING member_id
      `;
      if (inserted.length === 0) {
        return Response.json({ success: false, error: "This token is already in use." }, { status: 409 });
      }

      if (v.crops.length > 0) {
        await db.transaction(
          v.crops.map((crop) => db`INSERT INTO farmer_crops (member_id, crop) VALUES (${v.memberId}, ${crop})`)
        );
      }

      smsRegistered(v.phone, v.memberId, lang);
      return Response.json({ success: true, memberId: v.memberId, created: true });
    }

    // ── Existing record ────────────────────────────────────────────────
    // Whoever holds a token can reach this, so it never overwrites a record
    // that's been verified or paid for, never accepts status fields from the
    // client, and never lets an empty value erase what's already saved.
    const limited = await rateLimit("register-update", clientIp(req), 120, 3600);
    if (limited) return limited;

    const row = existing[0] as { verification_status: string; photo: string };
    const locked = row.verification_status === "verified" || (await hasConfirmedPayment(v.memberId));
    if (locked) {
      return Response.json({ success: true, memberId: v.memberId, locked: true });
    }

    let photoKey = "";
    if (photo) {
      try {
        photoKey = await uploadPhoto(v.memberId, photo);
      } catch (err) {
        return serverError("register:photo", err, "Could not save your photo. Please try again.");
      }
    }

    // Demo walkthroughs use a mock KYC that never reaches the server, so only
    // there is a client-reported status honoured.
    const demoVerified = isDemoMode() && body.data.verificationStatus === "verified";

    await db`
      UPDATE farmers SET
        first_name = COALESCE(NULLIF(${v.firstName}, ''), first_name),
        last_name = COALESCE(NULLIF(${v.lastName}, ''), last_name),
        other_names = COALESCE(NULLIF(${v.otherNames}, ''), other_names),
        dob = COALESCE(NULLIF(${v.dob}, ''), dob),
        gender = COALESCE(NULLIF(${v.gender}, ''), gender),
        marital_status = COALESCE(NULLIF(${v.maritalStatus}, ''), marital_status),
        phone = COALESCE(NULLIF(${v.phone}, ''), phone),
        email = COALESCE(NULLIF(${v.email}, ''), email),
        nin = COALESCE(NULLIF(${v.nin}, ''), nin),
        bvn = COALESCE(NULLIF(${v.bvn}, ''), bvn),
        photo = COALESCE(NULLIF(${photoKey}, ''), photo),
        residential_address = COALESCE(NULLIF(${v.residentialAddress}, ''), residential_address),
        state = COALESCE(NULLIF(${v.state}, ''), state),
        lga = COALESCE(NULLIF(${v.lga}, ''), lga),
        community = COALESCE(NULLIF(${v.community}, ''), community),
        cluster = COALESCE(NULLIF(${v.cluster}, ''), cluster),
        farm_size_hectares = COALESCE(NULLIF(${v.farmSizeHectares}, ''), farm_size_hectares),
        years_farming = COALESCE(NULLIF(${v.yearsFarming}, ''), years_farming),
        nok_name = COALESCE(NULLIF(${v.nokName}, ''), nok_name),
        nok_relationship = COALESCE(NULLIF(${v.nokRelationship}, ''), nok_relationship),
        nok_phone = COALESCE(NULLIF(${v.nokPhone}, ''), nok_phone),
        verification_status = CASE WHEN ${demoVerified}::boolean THEN 'verified' ELSE verification_status END,
        verified_at = CASE WHEN ${demoVerified}::boolean THEN COALESCE(verified_at, now()) ELSE verified_at END
      WHERE member_id = ${v.memberId}
    `;

    if (photoKey && row.photo && row.photo !== photoKey) {
      deletePhoto(row.photo).catch(() => {});
    }

    if (v.crops.length > 0) {
      await db.transaction([
        db`DELETE FROM farmer_crops WHERE member_id = ${v.memberId}`,
        ...v.crops.map((crop) => db`INSERT INTO farmer_crops (member_id, crop) VALUES (${v.memberId}, ${crop})`),
      ]);
    }

    return Response.json({ success: true, memberId: v.memberId });
  } catch (err) {
    return serverError("register", err, "Could not save the registration. Please try again.");
  }
}
