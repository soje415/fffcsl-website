const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Downscales a chosen photo to a JPEG no larger than `maxDim` on its long
 * side. Phone cameras produce multi-megabyte files that would blow past the
 * request size limit, and re-encoding through a canvas also guarantees the
 * upload really is a plain JPEG (SVG and other formats are refused).
 */
export async function photoToJpegDataUrl(file: File, maxDim = 800, quality = 0.85): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("unsupported");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
