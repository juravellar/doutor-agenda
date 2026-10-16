import type { CSSProperties } from "react";

// A clinic's own color and logo (white label). Kept free of server code: the
// settings form validates with it before uploading.

export const BRAND_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

// Raster formats only: an SVG can carry scripts.
export const LOGO_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// The browser resizes logos to 128px, which stays far below this; the cap
// stops a crafted request from storing a huge string.
export const MAX_LOGO_LENGTH = 150_000;

// The stored logo as an image file, or null if it isn't one of the accepted
// formats. Returns base64 so this module stays free of Node's Buffer.
export const decodeLogo = (dataUrl: string | null | undefined) => {
  if (!dataUrl || !LOGO_DATA_URL_PATTERN.test(dataUrl)) {
    return null;
  }
  return {
    contentType: dataUrl.slice("data:".length, dataUrl.indexOf(";")),
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
  };
};

// The version changes with the logo, so the browser can cache each URL for
// good and fetches the image again only after a new upload.
export const clinicLogoUrl = (clinicId: string, version: string) =>
  `/api/clinics/${clinicId}/logo?v=${version}`;

const channel = (hex: string, offset: number) => {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) =>
  0.2126 * channel(hex, 1) +
  0.7152 * channel(hex, 3) +
  0.0722 * channel(hex, 5);

const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// White or near-black, whichever reads better on the brand color (WCAG).
export const readableTextOn = (hex: string) => {
  const background = luminance(hex);
  return contrast(background, 1) >= contrast(background, luminance("#0a0a0a"))
    ? "#ffffff"
    : "#0a0a0a";
};

export const contrastRatio = (foreground: string, background: string) =>
  contrast(luminance(foreground), luminance(background));

// Overrides the theme's primary color inside the app with the clinic's.
export const brandStyle = (color: string | null | undefined) => {
  if (!color || !BRAND_COLOR_PATTERN.test(color)) {
    return undefined;
  }
  const text = readableTextOn(color);
  return {
    "--primary": color,
    "--primary-foreground": text,
    "--ring": color,
    "--sidebar-primary": color,
    "--sidebar-primary-foreground": text,
  } as CSSProperties;
};

export const BRAND_COLOR_PRESETS = [
  "#2563eb",
  "#0d9488",
  "#16a34a",
  "#9333ea",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#64748b",
];

// The page backgrounds of the light and dark themes. Icons, links and
// borders use the brand color on them, so it needs 3:1 against each (WCAG
// for non-text elements); white or black text on buttons is handled apart.
const THEME_BACKGROUNDS = { claro: "#ffffff", escuro: "#09090b" } as const;
const MIN_CONTRAST = 3;

// Why the color would be hard to see, or null when it reads well in both
// themes.
export const brandColorWarning = (color: string) => {
  if (!BRAND_COLOR_PATTERN.test(color)) {
    return null;
  }
  const weak = Object.entries(THEME_BACKGROUNDS)
    .filter(([, background]) => contrastRatio(color, background) < MIN_CONTRAST)
    .map(([theme]) => theme);
  if (weak.length === 0) {
    return null;
  }
  return `Essa cor fica pouco visível em ícones e links no tema ${weak.join(" e no ")}. Prefira um tom ${weak[0] === "claro" ? "mais escuro" : "mais claro"}.`;
};

// The same override as a stylesheet on the document root, so it reaches the
// dialogs and menus Radix renders outside the layout. `:root.dark` outranks
// the dark theme's own values. Only validated #rrggbb colors get in.
export const brandStylesheet = (color: string | null | undefined) => {
  const style = brandStyle(color);
  if (!style) {
    return null;
  }
  const declarations = Object.entries(style)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `:root,:root.dark{${declarations}}`;
};
