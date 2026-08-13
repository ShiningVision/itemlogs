const users = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    name: 'User',
    email: 'user@nextmail.com',
    password: '123456',
    google_id: null,
    username: 'user',
  },
];

const languages = [
  { id: '1', name: 'English', code: 'en' },
  { id: '2', name: 'German', code: 'de' },
  { id: '3', name: '中文', code: 'zh' },
  { id: '4', name: 'Japanese', code: 'ja' },
  { id: '5', name: 'Korean', code: 'ko' },
  { id: '6', name: 'French', code: 'fr' },
  { id: '7', name: 'Spanish', code: 'es' },
];

// "Other" is intentionally not a seeded row here. An item's type is
// nullable, and a null type is now interpreted app-wide as "Other" for
// display purposes (see ItemForm's type select and every place a type name
// is rendered) — no real row is needed for that meaning to exist.
const types = [
  { id: '1', name: 'Strategy' },
  { id: '2', name: 'Type Moon' },
  { id: '3', name: 'Gucci' },
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
  { id: '1', name: 'Bags' },
  { id: '2', name: 'Games' },
  { id: '3', name: 'Figures' },
  { id: '4', name: 'Books' },
  { id: '5', name: 'Clothing' },
  { id: '6', name: 'Electronics' },
  { id: '7', name: 'Accessories' },
];

// IDs line up with each item's main_image below (1: Dragon Quest XI,
// 2: Canvas Tote Bag, 3: Collector Figure - Knight, 4: Strategy Handbook).
const images = [
  { id: '1', url: '/images/dragon_quest.jpg' },
  { id: '2', url: '/images/pc.png' },
  { id: '3', url: '/images/knight.jpg' },
  { id: '4', url: '/images/strategy_handbook.jpg' },
];

const packages = [
  {
    id: '1',
    name: 'Summer Import Batch',
    description: 'A batch of items imported for the summer season.',
    departure_date: '2026-06-01',
    arrival_date: '2026-06-20',
    tariff: '18.50',
    tariff_currency: '2',
    shipping_fee: '55.00',
    shipping_fee_currency: '2',
    show_on_storefront: false,
  },
];

const items = [
  {
    id: '1',
    name: 'Dragon Quest XI',
    description: 'A classic JRPG in great condition.',
    location: 'Japan',
    barcode: '4988601234567',
    status: 1,
    cost_price: '25.00',
    purchase_price: '20.00',
    purchase_price_currency: '4',
    sell_price: '45.00',
    type: '3',
    category: '2',
    main_image: '1',
    package_id: '1',
  },
  {
    id: '2',
    name: 'My PC',
    description: 'CPU: AMD Ryzen 9 7900 316€, GPU: NVIDIA RTX 5070 Twin 12GB 537€, RAM: Kingston FURY 64GB DDR5 6000MT/s 630€, SSD: Samsung 990 PRO - 2 TB 220€',
    location: 'Germany',
    barcode: '4006381333931',
    status: 2,
    cost_price: '1703.00',
    purchase_price: '1703.00',
    purchase_price_currency: '2',
    sell_price: '0.00',
    // Was type '5' ("Other") — that seeded row no longer exists; null means
    // the same thing now (see the comment above the `types` array).
    type: null,
    category: '6',
    main_image: '2',
    package_id: '1',
  },
  {
    id: '3',
    name: 'Collector Figure - Knight',
    description: 'Limited-edition painted resin figure.',
    location: 'China',
    barcode: '6941234567890',
    status: 2,
    cost_price: '38.00',
    purchase_price: '30.00',
    purchase_price_currency: '3',
    sell_price: '79.99',
    type: '2',
    category: '3',
    main_image: '3',
    package_id: '1',
  },
  {
    id: '4',
    name: 'Strategy Handbook',
    description: 'Hardcover guide, some shelf wear.',
    location: 'USA',
    barcode: '9780306406157',
    status: 2,
    cost_price: '7.00',
    purchase_price: '5.00',
    purchase_price_currency: '1',
    sell_price: '15.00',
    type: '4',
    category: '4',
    main_image: '4',
    package_id: null,
  },
];

const sales = [
  { id: '1', name: 'Spring Clearance', date: '2026-04-01' },
  { id: '2', name: 'Anniversary Sale', date: '2026-07-01' },
];

// join table: sales <-> items
const salesItems = [
  { sales_id: '1', item_id: '2' },
  { sales_id: '1', item_id: '4' },
  { sales_id: '2', item_id: '3' },
];

// join table: items <-> images (extra gallery images beyond main_image)
const itemImages = [
  { image_id: '1', item_id: '1' },
  { image_id: '2', item_id: '1' },
  { image_id: '2', item_id: '2' },
  { image_id: '3', item_id: '3' },
  { image_id: '4', item_id: '4' },
];

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
    contact_info: null,
    show_location: false,
    show_package_filter: false,
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
    use_package_fees: false,
    use_barcode: false,
    name_category: 'Category',
    name_status: 'Status',
    name_type: 'Type',
    name_package: 'Packages',
    name_item: 'Item',
    display_profit: false,
    display_sell_price: false,
    display_purchase_price: false,
    display_cost_price: false,
  },
];

export {
  users,
  languages,
  settings,
  types,
  currencies,
  categories,
  images,
  packages,
  items,
  sales,
  salesItems,
  itemImages,
};