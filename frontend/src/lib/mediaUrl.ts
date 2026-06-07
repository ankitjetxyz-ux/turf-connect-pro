import { getBackendOrigin as resolveBackendOrigin } from "@/lib/apiConfig";

/** Turn API upload paths (/uploads/...) into a browser-loadable URL. */
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
  const origin = resolveBackendOrigin();
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
