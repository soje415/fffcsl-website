import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_NAME ?? "fffcsl-photos";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type PhotoMime = keyof typeof EXT_BY_MIME;
const MIME_BY_EXT: Record<string, PhotoMime> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export class PhotoError extends Error {}

export type ParsedPhoto = { body: Buffer; mime: PhotoMime; ext: string };

function sniffMime(b: Buffer): PhotoMime | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

/**
 * Accepts only a base64 JPEG/PNG/WebP data URL whose bytes really are that
 * format. The declared type is never trusted: SVG/HTML "photos" would run as
 * script if served back from our own origin.
 */
export function parsePhotoDataUrl(dataUrl: string): ParsedPhoto {
  const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || dataUrl.length > Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 64) {
    throw new PhotoError("Photo must be a JPEG, PNG or WebP image under 2 MB.");
  }
  const body = Buffer.from(match[1], "base64");
  if (body.length === 0 || body.length > MAX_PHOTO_BYTES) {
    throw new PhotoError("Photo must be a JPEG, PNG or WebP image under 2 MB.");
  }
  const mime = sniffMime(body);
  if (!mime) throw new PhotoError("Photo must be a JPEG, PNG or WebP image under 2 MB.");
  return { body, mime, ext: EXT_BY_MIME[mime] };
}

function client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }
  return new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Stores a validated passport photo in R2 and returns its object key. */
export async function uploadPhoto(memberId: string, photo: ParsedPhoto): Promise<string> {
  const key = `photos/${memberId}.${photo.ext}`;
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: photo.body,
      ContentType: photo.mime,
      CacheControl: "private, max-age=3600",
    })
  );
  return key;
}

export async function deletePhoto(key: string): Promise<void> {
  if (!key) return;
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Fetches a stored photo. The response type comes from the key's extension
 * (which we control), never from object metadata. Returns null if the key is
 * empty, unrecognised, or the object doesn't exist.
 */
export async function downloadPhoto(
  key: string
): Promise<{ body: Uint8Array; contentType: PhotoMime } | null> {
  if (!key) return null;
  const contentType = MIME_BY_EXT[key.split(".").pop()?.toLowerCase() ?? ""];
  if (!contentType) return null;
  try {
    const res = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await res.Body?.transformToByteArray();
    if (!body) return null;
    return { body, contentType };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    throw err;
  }
}
