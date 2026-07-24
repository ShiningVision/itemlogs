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
export type Item = {
  id: number;
  name: string | null;
  description: string | null;
  origin: string | null;
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
  show_origin: boolean;
  show_package_filter: boolean;
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
  origin: string | null;
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
  email: string;
  password: string | null;
  google_id: string | null;
  username: string | null;
};