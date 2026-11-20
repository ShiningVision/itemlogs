// app/api/keepalive/route.ts
//
// Deliberately unauthenticated and public. Its only job is to make one
// trivial Supabase query so the project registers as "active" and doesn't
// get auto-paused after 7 days of inactivity (see
// https://supabase.com/docs/guides/platform/free-project-pausing — any
// API request or database query resets the timer, not just dashboard
// visits). Meant to be hit on a schedule by an external cron (e.g. a
// Cloudflare Worker Cron Trigger) — see cloudflare/keepalive-worker.js in
// this repo for a ready-to-deploy example.
//
// Kept intentionally cheap and boring: a single-row select by primary key
// on `settings` (there's always exactly one row, id=1), no joins, nothing
// derived from the request. Not rate-limited on purpose — the query costs
// nothing meaningful and a plain GET endpoint with no side effects doesn't
// need one.
//
// ONE addition: when the caller proves it's the central site (the
// x-keepalive-token header equals this deployment's AUTH_SECRET — the
// central site stores every tenant's AUTH_SECRET, see tenants.auth_secret),
// the response also carries `lastLogin`, the ISO timestamp of the owner's
// last dashboard use (settings.last_login_at, see Settings.last_login_at).
// Anyone else gets only { ok } — when the owner was last active isn't
// something to hand to the public internet.
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabase } from '@/app/lib/db/client';

function isCentralSite(request: Request): boolean {
  const secret = process.env.AUTH_SECRET;
  const provided = request.headers.get('x-keepalive-token');
  if (!secret || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const { data, error } = await supabase
    .from('settings')
    .select('id, last_login_at')
    .eq('id', 1)
    .limit(1)
    .maybeSingle();

  // Even on failure, respond 200 — this endpoint exists to ping Supabase,
  // not to report tenant health. A real outage will surface elsewhere
  // (dashboard/storefront erroring for the tenant); this route staying
  // quiet just means a keep-alive cron sees a normal response either way
  // instead of retry/alerting noise for something it isn't meant to
  // monitor.
  const body: { ok: boolean; lastLogin?: string | null } = { ok: !error };
  if (!error && isCentralSite(request)) {
    body.lastLogin = data?.last_login_at ?? null;
  }

  return NextResponse.json(body, { status: 200 });
}
