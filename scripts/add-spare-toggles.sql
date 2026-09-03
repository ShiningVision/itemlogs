-- scripts/add-spare-toggles.sql
--
-- One-time fix for tenants provisioned before app/api/setup/route.ts
-- started reserving spare boolean/text columns on `settings`. Same
-- situation as scripts/enable-rls.sql: redeploying a tenant does NOT run
-- setup again (it's guarded to run once ever), so this has to be applied
-- directly to each already-provisioned tenant's database.
--
-- NOTE: as of the show_featured_items / show_description rename, this
-- script is only relevant to a tenant you're deliberately bringing up to
-- the current schema (e.g. un-freezing a legacy tenant). All tenants
-- provisioned before that rename are considered legacy and are expected to
-- keep running their original spare_toggle_1/spare_toggle_2 columns as-is —
-- do not run this against one unless you also intend to update its code.
--
-- As of the dashboard-redesign checklist/storage-widget columns below,
-- spare_toggle_1-4 are ALSO claimed now (checklist_added_contact/
-- checklist_organized/checklist_picked_theme/show_dashboard_storage_widget
-- — see app/api/setup/route.ts). Same rule applies: only relevant when
-- deliberately upgrading a legacy tenant that's already past the
-- show_featured_items/show_description rename above.
--
-- Run via the Supabase dashboard's SQL Editor, or:
--   psql "$POSTGRES_URL" -f scripts/add-spare-toggles.sql
-- (grab POSTGRES_URL from that tenant's Vercel project env vars)

ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_featured_items BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_description BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_added_contact BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_organized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS checklist_picked_theme BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_dashboard_storage_widget BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_5 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_6 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_7 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_toggle_8 BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_telegram VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_instagram VARCHAR(255);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_4 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_5 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_6 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_7 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_8 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_9 VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS spare_text_10 VARCHAR(255);

-- Widen description columns from VARCHAR(255) to unbounded TEXT (only
-- matters for a tenant whose table predates this change).
ALTER TABLE packages ALTER COLUMN description TYPE TEXT;
ALTER TABLE items ALTER COLUMN description TYPE TEXT;
ALTER TABLE blueprints ALTER COLUMN description TYPE TEXT;
