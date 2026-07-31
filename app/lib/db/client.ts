import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// createClient() used to run eagerly at module load. That's fine once
// SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are set, but for a freshly
// provisioned tenant whose Supabase Marketplace resource hasn't attached
// yet (e.g. still waiting on Vercel's one-time integration terms
// acceptance), those env vars don't exist yet — and because nearly every
// route transitively imports this module, the eager throw ("supabaseUrl is
// required") took down the *entire* Next.js build, not just the pages that
// actually touch the database.
//
// Deferring instantiation behind a Proxy means merely importing `supabase`
// no longer constructs the client, so build-time page-data collection for
// pages that never call it succeeds regardless of whether the env vars are
// set yet. The client is still only actually created once, on first real
// use, and every existing call site (`supabase.from(...)`, etc.) keeps
// working unchanged.
let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only — bypasses RLS, never expose to the client
    );
  }
  return cached;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});