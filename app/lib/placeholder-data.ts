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
  { id: '3', name: 'Chinese', code: 'zh' },
  { id: '4', name: 'Japanese', code: 'ja' },
  // Placeholder — messages/ko.json is currently just a copy of en.json.
  // Real Korean translations to be filled in later.
  { id: '5', name: 'Korean', code: 'ko' },
];

const types = [
  { id: '1', name: 'Action' },
  { id: '2', name: 'Adventure' },
  { id: '3', name: 'RPG' },
  { id: '4', name: 'Strategy' },
  { id: '5', name: 'Other' },
];

// FIXED: was { id, name } — table needs currency_code / currency_name / currency_symbol
const currencies = [
  { id: '1', currency_code: 'USD', currency_name: 'US Dollar', currency_symbol: '$' },
  { id: '2', currency_code: 'EUR', currency_name: 'Euro', currency_symbol: '€' },
  { id: '3', currency_code: 'CNY', currency_name: 'Chinese Yuan', currency_symbol: '¥' },
  { id: '4', currency_code: 'JPY', currency_name: 'Japanese Yen', currency_symbol: '¥' },
];

const categories = [
  { id: '1', name: 'Bags' },
  { id: '2', name: 'Games' },
  { id: '3', name: 'Figures' },
  { id: '4', name: 'Books' },
  { id: '5', name: 'Clothing' },
  { id: '6', name: 'Electronics' },
  { id: '7', name: 'Accessories' },
  { id: '8', name: 'Other' },
];

const images = [
  { id: '1', url: '/images/placeholder-1.png' },
  { id: '2', url: '/images/placeholder-2.png' },
  { id: '3', url: '/images/placeholder-3.png' },
  { id: '4', url: '/images/placeholder-4.png' },
];

const packages = [
  {
    id: '1',
    name: 'Spring 2026 Restock',
    description: 'A selection of new items arriving from Japan.',
    departure_date: '2026-03-01',
    arrival_date: '2026-03-15',
    tariff: '25.00',
    tariff_currency: '1',
    shipping_fee: '40.00',
    shipping_fee_currency: '1',
  },
  {
    id: '2',
    name: 'Summer Import Batch',
    description: 'A batch of items imported for the summer season.',
    departure_date: '2026-06-01',
    arrival_date: '2026-06-20',
    tariff: '18.50',
    tariff_currency: '2',
    shipping_fee: '55.00',
    shipping_fee_currency: '2',
  },
];

const items = [
  {
    id: '1',
    name: 'Dragon Quest XI',
    description: 'A classic JRPG in great condition.',
    origin: 'Japan',
    barcode: '4988601234567',
    status: 1,
    cost_price: '25.00',
    purchase_price: '20.00',
    purchase_price_currency: '4',
    sell_price: '45.00',
    type: '3',
    category: '2',
    main_image: '1',
    package_id: '2',
  },
  {
    id: '2',
    name: 'Canvas Tote Bag',
    description: 'Reinforced canvas bag with leather straps.',
    origin: 'Germany',
    barcode: '4006381333931',
    status: 2,
    cost_price: '10.00',
    purchase_price: '8.00',
    purchase_price_currency: '2',
    sell_price: '24.99',
    type: '5',
    category: '1',
    main_image: '2',
    package_id: '2',
  },
  {
    id: '3',
    name: 'Collector Figure - Knight',
    description: 'Limited-edition painted resin figure.',
    origin: 'China',
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
    origin: 'USA',
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
    owned_themes: ['default', 'dark'],
    tried_themes: [],
    theme_trial_expires_at: null,
    storefront_name: null,
    storefront_tagline: null,
    storefront_density: 'dense',
    show_contact: false,
    contact_info: null,
    show_origin: false,
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
      'Itemlogs is a FREE inventory system for collectors, hobbyists, and small businesses. \n No gatekeeping of functionalities, no ads, no subscriptions, and no tracking. \n Try it out!',
    use_sell_price: true,
    use_package_fee_distribution: false,
    use_barcode: false,
    name_category: 'Category',
    name_status: 'Status',
    name_type: 'Brand',
    name_package: 'Package',
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