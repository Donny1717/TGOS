function hostnameFromAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL ?? process.env.WEB_APP_URL;
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function isLocalAuthBypassEnabled(hostname?: string | null) {
  if (process.env.DISABLE_AUTH !== "true") return false;
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.VERCEL || process.env.CI) return false;

  const host = hostname ?? hostnameFromAppUrl();
  return Boolean(host && isLoopbackHost(host));
}
