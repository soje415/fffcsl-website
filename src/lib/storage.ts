import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_BUCKET ?? "fffcsl-photos";

function client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION ?? "us-east-2";
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 storage is not configured.");
  }
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function ensureBucket(s3: S3Client) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404) {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } else {
      throw err;
    }
  }
}

/**
 * Upload a passport photo (base64 data URL) to S3 and return its object key.
 */
export async function uploadPhoto(memberId: string, dataUrl: string): Promise<string> {
  const s3 = client();
  await ensureBucket(s3);

  const mime = dataUrl.match(/^data:([^;]+);base64,/)?.[1] ?? "image/jpeg";
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const body = Buffer.from(base64, "base64");
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const key = `photos/${memberId}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
    })
  );

  return key;
}

/**
 * Fetch a stored passport photo back out of S3 for the public verification
 * page. Returns null if the key is empty or the object doesn't exist.
 */
export async function downloadPhoto(
  key: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!key) return null;
  const s3 = client();
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await res.Body?.transformToByteArray();
    if (!body) return null;
    return { body, contentType: res.ContentType ?? "image/jpeg" };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    throw err;
  }
}
