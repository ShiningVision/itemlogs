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
export const dynamic = 'force-dynamic';

import { supabase } from '@/app/lib/db/client';

export async function GET() {
  const { error } = await supabase.from('settings').select('id').limit(1);
  return Response.json({ ready: !error });
}
