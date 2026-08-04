// app/lib/central-site.ts
//
// Talks to itemlogs.com (the central control-plane site) for anything that
// has to be verified server-side rather than trusted from this install's
// own database — right now, just theme purchase status. Price, and whether
// a theme has been bought/tried, live centrally (see itemlogs-website's
// app/api/get_themes and app/api/try_theme) rather than being hardcoded or
// self-reported here, since a tenant fully controls their own database and
// could otherwise just mark themselves as owning a paid theme.
//
// Both calls happen from server code (a Server Component and a Server
// Action, never the browser directly), so this is a plain server-to-server
// fetch — no CORS concerns despite being cross-origin in URL terms.

const CENTRAL_SITE_URL = 'https://itemlogs.com';

export type CentralThemeStatus = {
  slug: string;
  name: string;
  priceCents: number;
  purchased: boolean;
  tried: boolean;
};

// Network/central-site failures are treated as "nothing verified" (every
// paid theme locked) rather than thrown — a themes page that can't reach
// the central site should degrade to "can't sell/unlock anything right
// now", not crash or silently trust local state.
export async function fetchThemeStatuses(appUrl: string): Promise<CentralThemeStatus[] | null> {
  try {
    const res = await fetch(`${CENTRAL_SITE_URL}/api/get_themes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: appUrl }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { themes?: CentralThemeStatus[] };
    return data.themes ?? null;
  } catch {
    return null;
  }
}

export async function reportThemeTried(
  appUrl: string,
  theme: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${CENTRAL_SITE_URL}/api/try_theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: appUrl, theme }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.error ?? `Request failed (${res.status})` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export function buyThemeUrl(appUrl: string, theme: string): string {
  const params = new URLSearchParams({ url: appUrl, theme });
  return `${CENTRAL_SITE_URL}/themes?${params.toString()}`;
}
