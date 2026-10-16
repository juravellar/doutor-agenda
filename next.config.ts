import type { NextConfig } from "next";

// Patient data is on most pages, so the app must never be framed by another
// site (clickjacking) and must only be reached over HTTPS. A script-src policy
// is left out: it needs a nonce per request and an allowance for Stripe.js.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Routes were renamed to Portuguese. Old links (bookmarks, emails already
// sent, the Stripe portal's return URL) keep working through permanent
// redirects, which also tell browsers and search engines the new address.
const RENAMED_ROUTES: Record<string, string> = {
  "/authentication": "/entrar",
  "/dashboard": "/painel",
  "/appointments": "/agendamentos",
  "/doctors": "/medicos",
  "/patients": "/pacientes",
  "/subscription": "/assinatura",
  "/new-subscription": "/assinatura",
  "/clinics": "/clinicas",
  "/clinic-settings": "/configuracoes-da-clinica",
  "/clinic-form": "/nova-clinica",
  "/account": "/minha-conta",
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return Object.entries(RENAMED_ROUTES).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
