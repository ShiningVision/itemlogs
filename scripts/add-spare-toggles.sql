-- scripts/add-spare-toggles.sql
--
-- One-time fix for tenants provisioned before app/api/setup/route.ts
-- started reserving 10 spare boolean columns on `settings`. Same situation
-- as scripts/enable-rls.sql: redeploying a tenant does NOT run setup again
-- (it's guarded to run once ever), so this has to be applied directly to
-- each already-provisioned tenant's database.
--
-- Run via the Supabase dashboard's SQL Editor, or:
--   psql "$POSTGRES_URL" -f scripts/add-spare-toggles.sql
-- (grab POSTGRES_URL from that tenant's Vercel project env vars)

ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_1 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_2 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_3 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_4 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_5 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_6 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_7 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_8 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_9 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_10 BOOLEAN NOT NULL DEFAULT false;
