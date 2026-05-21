function getBackendOrigin(): string {
  const explicit = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (explicit?.trim()) {
    return explicit.trim().replace(/\/$/, "");
  }

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    const parsed = new URL(apiUrl.replace(/\/$/, ""));
    const basePath = parsed.pathname.replace(/\/api\/?$/, "");
    return `${parsed.origin}${basePath}`.replace(/\/$/, "");
  }

  return "";
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const origin = getBackendOrigin();
  return origin ? `${origin}${path}` : path;
}

export function resolveMediaUrls(
  urls?: string | string[] | null,
): string[] {
  if (!urls) return [];

  const list = Array.isArray(urls)
    ? urls
    : urls.split(",").map((item) => item.trim());

  return list.map(resolveMediaUrl).filter(Boolean);
}
