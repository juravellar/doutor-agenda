import { LOGO_DATA_URL_PATTERN, MAX_LOGO_LENGTH } from "@/lib/branding";

const LOGO_SIZE = 128;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

// Shrinks an uploaded logo in the browser to fit 128×128 (keeping its
// proportions) and returns it as a data URL small enough to store with the
// clinic. Throws a message for the user when the file can't be used.
export async function resizeLogo(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Use uma imagem PNG, JPG ou WebP.");
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Não foi possível ler essa imagem.");
  });
  const scale = Math.min(1, LOGO_SIZE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Não foi possível ler essa imagem.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Browsers that can't encode WebP fall back to PNG on their own.
  const dataUrl = canvas.toDataURL("image/webp", 0.9);
  if (
    dataUrl.length > MAX_LOGO_LENGTH ||
    !LOGO_DATA_URL_PATTERN.test(dataUrl)
  ) {
    throw new Error("Essa imagem ficou grande demais. Tente outra.");
  }
  return dataUrl;
}
