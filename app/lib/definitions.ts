export type Currency = {
  id: number;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
};

export type Language = {
  id: number;
  name: string;
  code: string;
};

export type Category = {
  id: number;
  name: string | null;
};

export type Type = {
  id: number;
  name: string | null;
};
export type Image = {
  id: number;
  url: string;
};
export type Location = {
  id: number;
  name: string | null;
};

export type Item = {
  id: number;
  name: string | null;
  description: string | null;
  location_id: number | null;
  barcode: string | null;
  status: number;
  cost_price: number | null;
  purchase_price: number | null;
  purchase_price_currency: number;
  sell_price: number | null;
  type: number | null;
  category: number | null;
  main_image: number | null;
  package_id: number | null;
  is_featured: boolean;
  // Private, owner-only — never present in any public/storefront-facing
  // fetch, gated on the dashboard by settings.use_secret_notes. See
  // app/api/setup/route.ts's items table comment.
  notes: string | null;
};

export type Settings = {
  id: number;
  show: boolean;
  show_sell_price: boolean;
  show_cost_price: boolean;
  show_purchase_price: boolean;
  show_status_1: boolean;
  show_status_2: boolean;
  show_status_3: boolean;
  show_status_4: boolean;
  show_message: string | null;
  sell_price_currency: number;
  default_purchase_price_currency: number;
  use_sell_price: boolean;
  use_package_fees: boolean;
  use_barcode: boolean;
  language: number;
  name_category: string | null;
  // No longer a generic "rename the word Status" field — "Status" itself
  // is not tenant-renameable. Repurposed to hold the tenant-chosen name for
  // a 5th status option (gated by show_status_5 below), defaulting to the
  // "status5" translation ("Undefined") when null/blank.
  name_status: string | null;
  name_type: string | null;
  name_package: string | null;
  name_item: string | null;
  display_profit: boolean;
  display_sell_price: boolean;
  display_purchase_price: boolean;
  display_cost_price: boolean;
  theme: string | null;
  owned_themes: string[];
  tried_themes: string[];
  theme_trial_expires_at: string | null;
  storefront_name: string | null;
  storefront_tagline: string | null;
  storefront_density: string;
  show_contact: boolean;
  contact_whatsapp: string | null;
  show_location: boolean;
  show_package_filter: boolean;
  // Gates the private items.notes field. Toggle copy/labels call this
  // "secret notes" for the user; the column/setting name is just "notes".
  use_secret_notes: boolean;
  // Gates a location filter section on the storefront (mirrors
  // show_package_filter). Distinct from show_location above, which only
  // controls whether an item's assigned location shows on its own detail
  // page.
  show_location_filter: boolean;
  // Customizable label for "location," mirrors name_category/name_type/
  // name_package above.
  name_location: string | null;
  // The tenant's own canonical URL (e.g. "https://my-shop.vercel.app"),
  // captured once at /setup from the request's Host header. Stored rather
  // than re-derived per-request so it's a plain queryable fact any client
  // can read — including a future mobile app, which has no "current page
  // URL" of its own to infer this from.
  app_url: string | null;
  // Onboarding checklist progress — sticky booleans (see
  // app/api/setup/route.ts and OnboardingChecklist.tsx). Once true, these
  // never flip back to false, even if the underlying condition later stops
  // being true (e.g. the tenant turns the storefront back off, or deletes
  // their only real item).
  checklist_added_item: boolean;
  checklist_named_storefront: boolean;
  checklist_went_live: boolean;
  // No longer read by any onboarding-checklist code — those two steps were
  // dropped. Kept in the type (and the DB) since removing a column isn't
  // free; see app/api/setup/route.ts's comment on the same columns.
  checklist_added_contact: boolean;
  checklist_organized: boolean;
  // Set once `theme` is ever set to anything other than null/'default'.
  checklist_picked_theme: boolean;
  // Set once the tenant has given the category/type/location fields a
  // custom label of their own (see hasRenamedTaxonomy in
  // app/lib/services/items.ts, checked against name_category/name_type/
  // name_location below).
  checklist_renamed_taxonomy: boolean;
  // "Show featured items" (see components/dashboard/FeaturedItemsSection.tsx).
  show_featured_items: boolean;
  // "Show description" on the storefront item detail page.
  show_description: boolean;
  // Gates the dashboard's Blob storage donut widget (see
  // StorageDonutWidget.tsx) — off by default, persisted once a tenant
  // opts in.
  show_dashboard_storage_widget: boolean;
  // 5th, tenant-named status option: whether it exists / is offered to
  // visitors. Its name lives in name_status above (defaulting to the
  // "status5" translation, "Undefined", when blank). See
  // components/dashboard/SettingsForm.tsx, app/page.tsx and
  // app/items/[id]/page.tsx.
  show_status_5: boolean;
  // INVERTED on purpose: true hides the whole "type" tag pool (filters on the
  // dashboard and visitor page, the item form's type picker, the item page's
  // type badge, the Excel type column/import). Inverted so that the column
  // default (false) means "types shown" — existing tenants kept types
  // visible with zero data changes. The settings UI presents it as a normal
  // "Use types" switch; code reads it through typesEnabled() in
  // app/lib/typesEnabled.ts. Hiding never deletes stored type assignments.
  hide_types: boolean;
  // INVERTED, same idea as hide_types: true hides the whole location feature.
  // Read it through locationsEnabled() in app/lib/locationsEnabled.ts.
  hide_locations: boolean;
  // Whether items carry an optional date (items.item_datetime, date only — no
  // time of day) at all. Off by default; read through datetimeEnabled() in
  // app/lib/datetime.ts.
  use_datetime: boolean;
  // Show that date on the visitor item page (only meaningful while
  // use_datetime is on). Off by default. See datetimeShown() in
  // app/lib/datetime.ts.
  show_datetime: boolean;
  // INVERTED: false (the default) = items with the same name, description and
  // sell price are collapsed into one card on the storefront; true = every
  // copy is shown. Read through groupIdenticalItems() in
  // app/lib/groupIdentical.ts.
  ungroup_identical_items: boolean;
  // Contact channels — see the comment on the same columns in
  // app/api/setup/route.ts. Each is a bare username/address (no @, no
  // https://), turned into a storefront button by app/lib/telegram.ts,
  // email.ts, instagram.ts respectively.
  contact_telegram: string | null;
  contact_email: string | null;
  contact_instagram: string | null;
  // ISO-8601 timestamp of the last time anyone used the dashboard (fresh
  // sign-in OR an already-signed-in session coming back — see
  // recordDashboardAccess in services/settings.ts). Written automatically,
  // never user-editable. Reported to the central site by /api/keepalive.
  last_login_at: string | null;
  // SPARE POOL — unclaimed columns kept ready so a new toggle-shaped or
  // text-shaped feature ships with ZERO database changes on any tenant.
  // To claim one: just start reading/writing spare_toggle_N / spare_text_N
  // under that exact name, and document what it means in a comment right
  // here (e.g. "// spare_toggle_13: INVERTED 'hide X' — read via xEnabled()")
  // and in the validation schema. Do NOT rename it or write a migration for
  // it. Toggles default to false, so claim one as an inverted flag whenever
  // a feature should default to ON.
  // Renaming claimed columns to proper names is an occasional batch
  // cleanup (a migration doing RENAME COLUMN plus a top-up of the pool back
  // to 20 toggles / 10 texts — see migration 0009 in
  // vercel-cli-runner/lib/migrations.js), never part of shipping a feature.
  spare_toggle_1: boolean;
  spare_toggle_2: boolean;
  spare_toggle_3: boolean;
  spare_toggle_4: boolean;
  spare_toggle_5: boolean;
  spare_toggle_6: boolean;
  spare_toggle_7: boolean;
  spare_toggle_8: boolean;
  spare_toggle_9: boolean;
  spare_toggle_10: boolean;
  spare_toggle_11: boolean;
  spare_toggle_12: boolean;
  spare_toggle_13: boolean;
  spare_toggle_14: boolean;
  spare_toggle_15: boolean;
  spare_toggle_16: boolean;
  spare_toggle_17: boolean;
  spare_toggle_18: boolean;
  spare_toggle_19: boolean;
  spare_toggle_20: boolean;
  spare_text_1: string | null;
  spare_text_2: string | null;
  spare_text_3: string | null;
  spare_text_4: string | null;
  spare_text_5: string | null;
  spare_text_6: string | null;
  spare_text_7: string | null;
  spare_text_8: string | null;
  spare_text_9: string | null;
  spare_text_10: string | null;
  // Resolved join (see getSettings) — every item's sell_price/cost_price is
  // denominated in this single shop-wide currency.
  sell_currency?: { currency_code: string; currency_symbol: string } | null;
};

export type Package = {
  id: number;
  name: string;
  description: string | null;
  departure_date: string | null; // ISO date string, e.g. "2026-08-01"
  arrival_date: string | null;
  tariff: number | null;
  tariff_currency: number;
  shipping_fee: number | null;
  shipping_fee_currency: number;
  show_on_storefront: boolean;
};

export type Blueprint = {
  id: number;
  name: string | null;
  description: string | null;
  location_id: number | null;
  barcode: string | null;
  status: number;
  cost_price: number | null;
  purchase_price: number | null;
  purchase_price_currency: number;
  sell_price: number | null;
  type: number | null;
  category: number | null;
  main_image: number | null;
};

export type Sale = {
  id: number;
  name: string | null;
  date: string; // ISO date
};

export type User = {
  id: string;
  name: string | null;
  password: string | null;
  username: string | null;
};