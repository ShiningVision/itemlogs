// app/lib/errors/isUnprovisionedTenantError.ts
//
// getSettings() throws whenever the `settings` table can't be read — but
// that happens for two very different reasons, and callers used to treat
// them identically (any error at all -> "this tenant just hasn't run
// /setup yet"):
//
//  1. Genuinely fresh tenant: the Supabase Marketplace resource is
//     provisioned but /setup has never run, so `settings` (and every other
//     table) doesn't exist yet. Expected, and the right move is to send
//     the visitor to /setup.
//  2. Everything else: the Supabase project got paused/banned (e.g. flagged
//     for having been created with a disposable email during the Vercel
//     integration), the service-role key was rotated/revoked, a network
//     blip, etc. Sending the visitor to /setup here is actively harmful —
//     it looks like the normal first-run wizard, gives no indication
//     anything is wrong, and if they fill it in again, /api/setup's raw
//     Postgres connection fails too (against the same broken backend),
//     surfacing a cryptic low-level error with still no explanation. A
//     tenant that already finished setup once can hit this on literally
//     any future page load, not just /setup.
//
// This checks for the specific "table isn't there" error codes so callers
// can tell the two apart: only case 1 should redirect to /setup, and case 2
// needs its own "we can't reach your database" messaging instead.
export function isUnprovisionedTenantError(error: unknown): boolean {
  const code = (error as { code?: string | null } | null | undefined)?.code;
  return (
    // Postgres "undefined_table" — from the raw `postgres` connection
    // (app/api/setup/route.ts's own pre-check, and anything else that
    // queries via `sql` directly).
    code === '42P01' ||
    // PostgREST "Could not find the table '...' in the schema cache" —
    // from supabase-js queries (getSettings() and everything else that
    // goes through app/lib/db/client.ts).
    code === 'PGRST205'
  );
}
