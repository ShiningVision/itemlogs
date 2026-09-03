-- scripts/nullable-document-package.sql
--
-- One-time fix for tenants provisioned before app/api/setup/route.ts
-- allowed `documents.package_id` to be NULL (needed for the Gallery's
-- "upload a document unrelated to any package" feature). Same situation as
-- scripts/add-spare-toggles.sql: redeploying a tenant does NOT run setup
-- again (it's guarded to run once ever), so this has to be applied
-- directly to each already-provisioned tenant's database.
--
-- Only relevant to a tenant you're deliberately bringing up to the current
-- schema (e.g. un-freezing a legacy tenant). Legacy tenants left alone are
-- unaffected — their existing package-scoped documents keep working either
-- way, they just won't be able to upload standalone documents until this
-- runs.
--
-- Run via the Supabase dashboard's SQL Editor, or:
--   psql "$POSTGRES_URL" -f scripts/nullable-document-package.sql
-- (grab POSTGRES_URL from that tenant's Vercel project env vars)

ALTER TABLE documents ALTER COLUMN package_id DROP NOT NULL;
