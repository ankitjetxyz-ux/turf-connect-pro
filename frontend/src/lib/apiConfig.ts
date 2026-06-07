export const PRODUCTION_API_ORIGIN = "https://api.bookmyturf.xyz";
export const PRODUCTION_API_URL = `${PRODUCTION_API_ORIGIN}/api`;

const PRODUCTION_HOSTS = new Set(["bookmyturf.xyz", "www.bookmyturf.xyz"]);

function isProductionSite(): boolean {
  return (
    typeof window !== "undefined" &&
    PRODUCTION_HOSTS.has(window.location.hostname)
  );
}

/** Resolved API base URL for axios (includes /api suffix). */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl?.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  if (import.meta.env.PROD && isProductionSite()) {
    return PRODUCTION_API_URL;
  }
  return "/api";
}

/** Backend origin for uploads and Socket.IO (no /api suffix). */
export function getBackendOrigin(): string {
  const explicit = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (explicit?.trim()) {
    return explicit.trim().replace(/\/$/, "");
  }

  const apiUrl = getApiBaseUrl();
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    const parsed = new URL(apiUrl.replace(/\/$/, ""));
    const basePath = parsed.pathname.replace(/\/api\/?$/, "");
    return `${parsed.origin}${basePath}`.replace(/\/$/, "");
  }

  if (import.meta.env.PROD && isProductionSite()) {
    return PRODUCTION_API_ORIGIN;
  }

  return "";
}

/** Normalize API error payloads (including Vercel 404 JSON) to a string. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && !("response" in err)) {
    return err.message;
  }

  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }

  return fallback;
}
