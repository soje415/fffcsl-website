import { ensureSchema, sql } from "@/lib/db";
import { uploadPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Record<string, unknown>;

    const memberId = String(data.memberId ?? "").trim();
    const firstName = String(data.firstName ?? "").trim();
    const lastName = String(data.lastName ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    const email = String(data.email ?? "").trim();

    if (!memberId || !firstName || !lastName || !phone || !email) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "Missing required registration fields." },
        { status: 400 }
      );
    }

    await ensureSchema();
    const db = sql();

    const str = (v: unknown) => String(v ?? "").trim();

    const photoDataUrl = str(data.photoDataUrl);
    let photoKey = "";
    if (photoDataUrl.startsWith("data:")) {
      try {
        photoKey = await uploadPhoto(memberId, photoDataUrl);
      } catch (err) {
        console.error("[register] photo upload failed", err);
      }
    }

    await db`
      INSERT INTO farmers (
        member_id, first_name, last_name, other_names, dob, gender, marital_status,
        phone, email, photo, residential_address, state, lga, community, cluster,
        farm_size_hectares, years_farming, nok_name, nok_relationship, nok_phone,
        kyc_type, verification_status, virtual_account_number, virtual_account_bank,
        virtual_account_customer_id
      ) VALUES (
        ${memberId}, ${firstName}, ${lastName},         ${str(data.otherNames)}, ${str(data.dob)},
        ${str(data.gender)}, ${str(data.maritalStatus)}, ${phone}, ${email},
        ${photoKey}, ${str(data.residentialAddress)}, ${str(data.state)},
        ${str(data.lga)}, ${str(data.community)}, ${str(data.cluster)},
        ${str(data.farmSizeHectares)}, ${str(data.yearsFarming)}, ${str(data.nokName)},
        ${str(data.nokRelationship)}, ${str(data.nokPhone)}, ${str(data.kycType)},
        ${str(data.verificationStatus)}, ${str(data.virtualAccountNumber)},
        ${str(data.virtualAccountBank)}, ${str(data.virtualAccountCustomerId)}
      )
      ON CONFLICT (member_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        other_names = EXCLUDED.other_names,
        dob = EXCLUDED.dob,
        gender = EXCLUDED.gender,
        marital_status = EXCLUDED.marital_status,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        photo = EXCLUDED.photo,
        residential_address = EXCLUDED.residential_address,
        state = EXCLUDED.state,
        lga = EXCLUDED.lga,
        community = EXCLUDED.community,
        cluster = EXCLUDED.cluster,
        farm_size_hectares = EXCLUDED.farm_size_hectares,
        years_farming = EXCLUDED.years_farming,
        nok_name = EXCLUDED.nok_name,
        nok_relationship = EXCLUDED.nok_relationship,
        nok_phone = EXCLUDED.nok_phone,
        kyc_type = EXCLUDED.kyc_type,
        verification_status = EXCLUDED.verification_status,
        virtual_account_number = EXCLUDED.virtual_account_number,
        virtual_account_bank = EXCLUDED.virtual_account_bank,
        virtual_account_customer_id = EXCLUDED.virtual_account_customer_id
    `;

    const crops = Array.isArray(data.crops)
      ? (data.crops as unknown[]).map((c) => String(c).trim()).filter(Boolean)
      : [];

    if (crops.length > 0) {
      await db`DELETE FROM farmer_crops WHERE member_id = ${memberId}`;
      for (const crop of crops) {
        await db`INSERT INTO farmer_crops (member_id, crop) VALUES (${memberId}, ${crop})`;
      }
    }

    const customerId = str(data.virtualAccountCustomerId);
    if (customerId) {
      await db`
        UPDATE payments SET member_id = ${memberId}
        WHERE customer_id = ${customerId}
      `;
    }

    return Response.json({ success: true, memberId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the registration.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
