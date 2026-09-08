// app/api/setup/status/route.ts
//
// Companion to POST /api/setup. That route's own waitForSettingsReadable()
// only proves `settings` was readable through *one* connection, at the
// moment *that* request happened to check — but Supabase's PostgREST layer
// can run multiple replicas behind its API gateway, each warming up its own
// schema cache independently after the DDL transaction's NOTIFY. A brand
// new tenant's very first requests (the redirect into /login, then the
// dashboard) can easily land on a different, still-cold replica than the
// one waitForSettingsReadable happened to poll — which is exactly what kept
// producing "Failed to save" (and, worse, an uncaught crash on the
// dashboard itself) even after that fix.
//
// So instead of trying to prove readiness once from inside the bounded
// /api/setup request (capped by maxDuration, and by definition unable to
// account for a *different* replica going stale later), this is a cheap,
// stateless, repeatable check SetupForm.tsx polls from the client — with no
// serverless duration ceiling on how long the wizard is willing to wait.
//
// This used to be a SELECT ('settings'.select('id').limit(1)) — but that
// only proves the *read* path is warm on whatever replica answered it. The
// dashboard's interactive toggles go through an UPDATE, and PostgREST
// doesn't guarantee read/write parity across replicas (see
// app/lib/services/settings.ts's updateSettings, which has no retry of its
// own): a tenant could sail through this check on a replica whose cache
// happens to already cover SELECT but not yet UPDATE, land on the
// dashboard, and immediately hit "Failed to save" on their very first
// toggle. So this now performs a real UPDATE instead — a genuine no-op
// write (show_location set to the same default value /api/setup just
// inserted, false) against a toggle whose value truly doesn't matter this
// early in onboarding — so a "ready" response actually proves the write
// path this tenant is about to depend on works, not just the read path.
export const dynamic = 'force-dynamic';

import { supabase } from '@/app/lib/db/client';

export async function GET() {
  const { error } = await supabase.from('settings').update({ show_location: false }).eq('id', 1);
  return Response.json({ ready: !error });
}
