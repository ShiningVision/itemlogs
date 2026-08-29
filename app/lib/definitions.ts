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
  contact_info: string | null;
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
  // Unassigned, reserved for future features (see app/api/setup/route.ts's
  // comment on the same columns). Once one gets used, rename it here to
  // match instead of adding a new field.
  //
  // spare_toggle_1: claimed — "Show featured items" (see
  // components/dashboard/FeaturedItemsSection.tsx). Left as spare_toggle_1
  // rather than renamed — see the setup route's comment for why.
  spare_toggle_1: boolean;
  // spare_toggle_2: claimed — "Show description" on the storefront item
  // detail page. Defaults false at the column level (already-provisioned
  // tenants get it off); new tenants get it on via an explicit value in the
  // setup route's INSERT, not by changing the column default.
  spare_toggle_2: boolean;
  spare_toggle_3: boolean;
  spare_toggle_4: boolean;
  spare_toggle_5: boolean;
  spare_toggle_6: boolean;
  spare_toggle_7: boolean;
  spare_toggle_8: boolean;
  spare_toggle_9: boolean;
  spare_toggle_10: boolean;
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