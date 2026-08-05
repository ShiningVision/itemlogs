-- scripts/enable-rls.sql
--
-- One-time fix for tenants provisioned before app/api/setup/route.ts
-- started enabling RLS on every table it creates. Redeploying a tenant
-- does NOT fix this — setup only ever runs once per tenant (guarded by a
-- 409 once `settings` has a row), so this has to be run directly against
-- each already-provisioned Supabase database.
--
-- This app only ever talks to Supabase via the service-role key (see
-- app/lib/db/client.ts), which bypasses RLS regardless of policies — so
-- enabling RLS here with zero policies is safe and won't break anything;
-- it just closes off the anon-key/PostgREST access path that has no
-- legitimate use in this app at all.
--
-- Run against a tenant's database via the Supabase dashboard's SQL Editor,
-- or:
--   psql "$POSTGRES_URL" -f scripts/enable-rls.sql
-- (grab POSTGRES_URL from that tenant's Vercel project's env vars)

-- IF EXISTS on every line on purpose — older tenants provisioned via the
-- long-retired /seed route may not have every table this app creates
-- today (share_passwords in particular is newer), and one missing table
-- shouldn't abort the rest of the statements.
ALTER TABLE IF EXISTS currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS share_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_images ENABLE ROW LEVEL SECURITY;
