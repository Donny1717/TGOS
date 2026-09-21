/**
 * Local product work without sign-in.
 * Set DISABLE_AUTH=true in root .env, restart `npm run dev`.
 * Never enable in production / Vercel / CI.
 * Real Google (or magic-link) auth comes later — do not block UI work on it.
 */

export function isLocalAuthBypassEnabled(_hostname?: string | null) {
  if (process.env.DISABLE_AUTH !== "true") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL || process.env.CI) return false;
  // Development only — no hostname gate (avoids 127.0.0.1 vs localhost loops).
  return process.env.NODE_ENV === "development" || process.env.APP_ENV === "development";
}

export const DEMO_ORG_ID = "demo";

export function isDemoOrganisation(organisationId: string) {
  return isLocalAuthBypassEnabled() && organisationId === DEMO_ORG_ID;
}
