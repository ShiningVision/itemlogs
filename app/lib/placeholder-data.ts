const languages = [
  { id: '1', name: 'English', code: 'en' },
  { id: '2', name: 'Deutsch', code: 'de' },
  { id: '3', name: '中文', code: 'zh' },
  { id: '4', name: '日本語', code: 'ja' },
  { id: '5', name: '한국어', code: 'ko' },
  { id: '6', name: 'Français', code: 'fr' },
  { id: '7', name: 'Español', code: 'es' },
];

// "Other" is intentionally not a seeded row here. An item's type is
// nullable, and a null type is now interpreted app-wide as "Other" for
// display purposes (see ItemForm's type select and every place a type name
// is rendered) — no real row is needed for that meaning to exist.
// `type` is used here as "manufacturer/publisher" — fits a toy/collectible
// inventory better than the item's general kind, which `category` covers.
const types = [
  { id: '1', name: 'Good Smile Company' },
  { id: '2', name: 'Crypton Future Media' },
  { id: '3', name: 'The Pokémon Company' },
  { id: '4', name: 'Square Enix' },
];

// FIXED: was { id, name } — table needs currency_code / currency_name / currency_symbol
const currencies = [
  { id: '1', currency_code: 'USD', currency_name: 'US Dollar', currency_symbol: '$' },
  { id: '2', currency_code: 'EUR', currency_name: 'Euro', currency_symbol: '€' },
  { id: '3', currency_code: 'CNY', currency_name: 'Chinese Yuan', currency_symbol: '¥' },
  { id: '4', currency_code: 'JPY', currency_name: 'Japanese Yen', currency_symbol: '¥' },
  { id: '5', currency_code: 'KRW', currency_name: 'South Korean Won', currency_symbol: '₩' },
  { id: '6', currency_code: 'GBP', currency_name: 'British Pound Sterling', currency_symbol: '£' },
  { id: '7', currency_code: 'CAD', currency_name: 'Canadian Dollar', currency_symbol: '$' },
  { id: '8', currency_code: 'AUD', currency_name: 'Australian Dollar', currency_symbol: '$' },
  { id: '9', currency_code: 'CHF', currency_name: 'Swiss Franc', currency_symbol: 'CHF' },
  { id: '10', currency_code: 'SEK', currency_name: 'Swedish Krona', currency_symbol: 'kr' },
  { id: '11', currency_code: 'HKD', currency_name: 'Hong Kong Dollar', currency_symbol: '$' },
  { id: '12', currency_code: 'SGD', currency_name: 'Singapore Dollar', currency_symbol: '$' },
  { id: '13', currency_code: 'TWD', currency_name: 'New Taiwan Dollar', currency_symbol: '$' },
];

// "Other" is intentionally not a seeded row here — same reasoning as
// types above; a null category is interpreted as "Other" everywhere it's
// displayed instead of needing a real backing row.
const categories = [
  { id: '1', name: 'Figures' },
  { id: '2', name: 'Art Books' },
  { id: '3', name: 'Plushies' },
  { id: '4', name: 'Video Games' },
  { id: '5', name: 'Accessories' },
];

// "Other" is intentionally not a seeded row here — same reasoning as
// types/categories above; a null location_id is interpreted as "no
// location" everywhere it's displayed instead of needing a real backing row.
const locations = [
  { id: '1', name: 'AmiAmi Tokyo' },
  { id: '2', name: 'Amazon' },
  { id: '3', name: 'Pokemon Center Kyoto' },
  { id: '4', name: 'Gamestop' },
];

// IDs line up with each item's main_image below (1: Hatsune Miku 15th
// Anniversary Figure, 2: Witch Hat Atelier Art Book, 3: Kimono Pikachu
// Plushie, 4: Dragon Quest XI).
const images = [
  { id: '1', url: '/images/miku_figure.jpg' },
  { id: '2', url: '/images/artbook.jpg' },
  { id: '3', url: '/images/pikachu.jpg' },
  { id: '4', url: '/images/dragon_quest.jpg' },
];

// Package documents (receipts, certificates of authenticity, etc.) — a
// separate table from `images`, since they're arbitrary file types (PDF,
// JPEG, ...) tied to exactly one package rather than shared/reusable across
// items. No seed rows; a fresh tenant just starts with none.
const documents: { id: string; package_id: string; url: string; filename: string; content_type: string }[] = [];

const packages = [
  {
    id: '1',
    name: 'Tokyo Import Haul',
    description: 'Figures and plushies shipped in from Japan.',
    departure_date: '2026-03-15',
    arrival_date: '2026-04-02',
    tariff: '22.00',
    tariff_currency: '2',
    shipping_fee: '4500',
    shipping_fee_currency: '4',
    show_on_storefront: true,
  },
];

// category_ids/type_ids replace the old scalar category/type columns —
// category and type are now many-to-many with items (item_categories/
// item_types join tables below), same as location's single-select FK but
// allowing more than one value. An empty array means "no categories" /
// "no types", displayed as "Other" everywhere (same meaning a null scalar
// used to have) — see OTHER_FILTER_ID in app/lib/services/items.ts.
const items = [
  {
    id: '1',
    name: '1/7 Scale Hatsune Miku 15th Anniversary Figure',
    description: 'Good Smile Company 1/7 scale figure celebrating Hatsune Miku\'s 15th anniversary. Still sealed in original box. Unopened.',
    location_id: '1',
    barcode: '4571245123456',
    status: 1,
    cost_price: '0.00',
    purchase_price: '24800.00',
    purchase_price_currency: '4',
    sell_price: '320.00',
    // Two types, to seed a real multi-select example (figure + music brand).
    type_ids: ['1', '2'],
    category_ids: ['1'],
    main_image: '1',
    package_id: '1',
  },
  {
    id: '2',
    name: 'Witch Hat Atelier Art Book',
    description: 'Kadokawa art book collecting illustrations and character design art from Witch Hat Atelier. Hardcover, near-mint.',
    location_id: '2',
    barcode: '9784041083879',
    status: 1,
    cost_price: '0.00',
    purchase_price: '28.00',
    purchase_price_currency: '2',
    sell_price: '40.00',
    // No types — displays as "Other" (see the comment above the `types`
    // array for why no real "Other" row is seeded).
    type_ids: [],
    // Two categories, to seed a real multi-select example.
    category_ids: ['2'],
    main_image: '2',
    package_id: null,
  },
  {
    id: '3',
    name: 'Pokémon Center Exclusive Kimono Pikachu Plushie',
    description: 'Pokémon Center exclusive plush wearing a kimono outfit, released for a seasonal event. Tag attached.',
    location_id: '3',
    barcode: '4521329123456',
    status: 1,
    cost_price: '0.00',
    purchase_price: '3200.00',
    purchase_price_currency: '4',
    sell_price: '70.00',
    type_ids: ['3'],
    category_ids: ['3'],
    main_image: '3',
    package_id: '1',
  },
  {
    id: '4',
    name: 'Dragon Quest XI',
    description: 'Physical copy of Dragon Quest XI: Echoes of an Elusive Age. Case and manual included, disc in great condition.',
    location_id: '4',
    barcode: '4988601234567',
    status: 1,
    cost_price: '0.00',
    purchase_price: '22.00',
    purchase_price_currency: '1',
    sell_price: '40.00',
    type_ids: ['4'],
    category_ids: ['4'],
    main_image: '4',
    package_id: null,
  },
];

// join tables: items <-> categories / items <-> types — derived from each
// item's category_ids/type_ids above rather than duplicated by hand, so
// there's exactly one place to edit the seed assignments.
const itemCategories = items.flatMap((i) => i.category_ids.map((category_id) => ({ item_id: i.id, category_id })));
const itemTypes = items.flatMap((i) => i.type_ids.map((type_id) => ({ item_id: i.id, type_id })));

const sales = [
  { id: '1', name: 'Online Marketplace Sale', date: '2026-07-20' },
];

// join table: sales <-> items — left empty (no seeded sales-to-item links),
// same reasoning as itemImages below. Explicitly typed for the same reason
// itemImages is: an untyped empty array literal infers as `any[]`, which
// only tsc's full type-check catches (esbuild strips types without
// checking them, so this stayed latent until a real `next build`/tsc run).
const salesItems: { sales_id: string; item_id: string }[] = [];

// join table: items <-> images (extra gallery images beyond main_image) —
// left empty since each seeded item only has the one dedicated photo (see
// the `images` array above); no separate gallery shots to attach.
const itemImages: { image_id: string; item_id: string }[] = [];

const settings = [
  {
    id: '1',
    theme: 'default',
    owned_themes: ['default'],
    tried_themes: [],
    theme_trial_expires_at: null,
    storefront_name: null,
    storefront_tagline: null,
    storefront_density: 'dense',
    show_contact: false,
    contact_info: 'Insert your contact info here (email, social media, etc.)',
    show_location: false,
    show_package_filter: true,
    show: false,
    show_sell_price: false,
    show_cost_price: false,
    show_purchase_price: false,
    show_status_1: true,
    show_status_2: false,
    show_status_3: false,
    show_status_4: false,
    sell_price_currency: '1',
    default_purchase_price_currency: '1',
    language: '1',
    show_message:
      'Itemlogs is a FREE inventory system for collectors, hobbyists, and small retail businesses. \n No gatekeeping of functionalities, no ads, no subscriptions, and no tracking. \n Try it out at itemlogs.com!',
    use_sell_price: true,
    use_package_fees: true,
    use_barcode: false,
    // Left null rather than hardcoded English — every place that reads
    // these (resolveLabel(settings.name_X, t('x'))) already falls back to
    // the storefront's own chosen-language translation whenever the column
    // is null (same as name_location below), so nulling them out here is
    // what actually makes new tenants' default labels match whatever
    // language they picked at setup, instead of always seeding literal
    // English text regardless of that choice.
    name_category: null,
    name_status: null,
    name_type: null,
    name_package: null,
    name_item: null,
    display_profit: false,
    display_sell_price: false,
    display_purchase_price: false,
    display_cost_price: false,
  },
];

export {
  languages,
  settings,
  types,
  currencies,
  categories,
  locations,
  images,
  packages,
  documents,
  items,
  itemCategories,
  itemTypes,
  sales,
  salesItems,
  itemImages,
};