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
// derived from the request, nothing sensitive returned. Not rate-limited on
// purpose — the query costs nothing meaningful and a plain GET endpoint
// with no side effects doesn't need one.
import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/db/client';

export async function GET() {
  const { error } = await supabase.from('settings').select('id').eq('id', 1).limit(1);

  // Even on failure, respond 200 — this endpoint exists to ping Supabase,
  // not to report tenant health. A real outage will surface elsewhere
  // (dashboard/storefront erroring for the tenant); this route staying
  // quiet just means a keep-alive cron sees a normal response either way
  // instead of retry/alerting noise for something it isn't meant to
  // monitor.
  return NextResponse.json({ ok: !error }, { status: 200 });
}
