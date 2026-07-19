// lib/url.ts
export function buildUrl(
  pathname: string,
  current: URLSearchParams,
  updates: Record<string, string | null>
) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  return `${pathname}?${params.toString()}`;
}