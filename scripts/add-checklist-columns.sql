-- scripts/add-checklist-columns.sql
--
-- One-time fix for tenants provisioned before app/api/setup/route.ts
-- started tracking onboarding-checklist progress on `settings`. Same
-- situation as scripts/add-spare-toggles.sql: redeploying a tenant does NOT
-- run setup again, so this has to be applied directly to each
-- already-provisioned tenant's database.
--
-- Run via the Supabase dashboard's SQL Editor, or:
--   psql "$POSTGRES_URL" -f scripts/add-checklist-columns.sql
-- (grab POSTGRES_URL from that tenant's Vercel project env vars)

ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_added_item BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_named_storefront BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_went_live BOOLEAN NOT NULL DEFAULT false;

-- Back-fill so tenants who already completed these steps before the columns
-- existed don't have the checklist item reappear.
UPDATE settings SET checklist_named_storefront = true
  WHERE storefront_name IS NOT NULL AND trim(storefront_name) <> '';

UPDATE settings SET checklist_added_item = true
  WHERE EXISTS (SELECT 1 FROM items WHERE id NOT IN (1, 2, 3, 4));

-- Anyone currently live has obviously gone live before.
UPDATE settings SET checklist_went_live = true WHERE show = true;
