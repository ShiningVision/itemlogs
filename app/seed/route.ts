import bcrypt from 'bcrypt';
import postgres from 'postgres';
import {
  currencies,
  languages,
  types,
  categories,
  images,
  sales,
  users,
  packages,
  items,
  settings,
  salesItems,
  itemImages,
} from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// ---------------------------------------------------------------------------
// Independent tables (no foreign keys) — safe to create/seed first
// ---------------------------------------------------------------------------

async function seedCurrencies(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS currencies (
      id SERIAL PRIMARY KEY,
      currency_code VARCHAR(3) NOT NULL,
      currency_name VARCHAR(255) NOT NULL,
      currency_symbol VARCHAR(255) NOT NULL
    );
  `;

  const insertedCurrencies = await Promise.all(
    currencies.map((currency) => {
      return sql`
        INSERT INTO currencies (id, currency_code, currency_name, currency_symbol)
        VALUES (${currency.id}, ${currency.currency_code}, ${currency.currency_name}, ${currency.currency_symbol})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  await sql`
    SELECT setval('currencies_id_seq', (SELECT MAX(id) FROM currencies));
  `;
  console.log('currencies ok');
  return insertedCurrencies;
}

async function seedLanguages(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS languages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL
    );
  `;

  const insertedLanguages = await Promise.all(
    languages.map((language) => {
      return sql`
        INSERT INTO languages (id, name, code)
        VALUES (${language.id}, ${language.name}, ${language.code})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  await sql`
    SELECT setval('languages_id_seq', (SELECT MAX(id) FROM languages));
  `;
  console.log('languages ok');
  return insertedLanguages;
}

async function seedTypes(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255)
    );
  `;

  const insertedTypes = await Promise.all(
    types.map((type) => {
      return sql`
        INSERT INTO types (id, name)
        VALUES (${type.id}, ${type.name})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log('types ok');
  await sql`
    SELECT setval('types_id_seq', (SELECT MAX(id) FROM types));
  `;
  return insertedTypes;
}

async function seedCategories(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255)
    );
  `;

  const insertedCategories = await Promise.all(
    categories.map((category) => {
      return sql`
        INSERT INTO categories (id, name)
        VALUES (${category.id}, ${category.name})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  await sql`
    SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
  `;
  console.log('categories ok');
  return insertedCategories;
}

async function seedImages(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      url VARCHAR(255) NOT NULL
    );
  `;

  const insertedImages = await Promise.all(
    images.map((image) => {
      return sql`
        INSERT INTO images (id, url)
        VALUES (${image.id}, ${image.url})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  await sql`
    SELECT setval('images_id_seq', (SELECT MAX(id) FROM images));
  `;
  console.log('images ok');
  return insertedImages;
}

async function seedSales(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      date DATE NOT NULL
    );
  `;

  const insertedSales = await Promise.all(
    sales.map((sale) => {
      return sql`
        INSERT INTO sales (id, name, date)
        VALUES (${sale.id}, ${sale.name}, ${sale.date})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  await sql`
    SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));
  `;
  console.log('sales ok');
  return insertedSales;
}

async function seedUsers(sql: postgres.Sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      google_id VARCHAR(255),
      username VARCHAR(255) UNIQUE
    );
  `;
  // Added after the table already existed in deployed environments — safe to
  // re-run, and covers instances where the table was created before this
  // column existed.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;`;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = user.password ? await bcrypt.hash(user.password, 10) : null;
      return sql`
        INSERT INTO users (id, name, email, password, google_id, username)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, ${user.google_id}, ${user.username})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  // Backfill any pre-existing rows (from before this column existed) with a
  // username derived from their email's local part, sanitized for use as a
  // subdomain-style identifier.
  await sql`
    UPDATE users
    SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE username IS NULL;
  `;

  console.log('users ok');
  return insertedUsers;
}

// ---------------------------------------------------------------------------
// Tables with foreign keys to the above — create/seed after their parents
// ---------------------------------------------------------------------------

async function seedPackages(sql: postgres.Sql) {
  // depends on: currencies
  await sql`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(255),
      departure_date DATE,
      arrival_date DATE,
      tariff NUMERIC(18,2),
      tariff_currency INTEGER NOT NULL REFERENCES currencies(id),
      shipping_fee NUMERIC(18,2),
      shipping_fee_currency INTEGER NOT NULL REFERENCES currencies(id)
    );
  `;

  const insertedPackages = await Promise.all(
    packages.map((pkg) => {
      return sql`
        INSERT INTO packages (
          id, name, description, departure_date, arrival_date,
          tariff, tariff_currency, shipping_fee, shipping_fee_currency
        )
        VALUES (
          ${pkg.id}, ${pkg.name}, ${pkg.description}, ${pkg.departure_date}, ${pkg.arrival_date},
          ${pkg.tariff}, ${pkg.tariff_currency}, ${pkg.shipping_fee}, ${pkg.shipping_fee_currency}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  await sql`
    SELECT setval('packages_id_seq', (SELECT MAX(id) FROM packages));
  `;
  console.log('packages ok');
  return insertedPackages;
}

async function seedItems(sql: postgres.Sql) {
  // depends on: packages, currencies, types, categories, images
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      description VARCHAR(255),
      origin VARCHAR(255),
      barcode VARCHAR(255),
      status INTEGER NOT NULL,
      cost_price NUMERIC(18,2),
      purchase_price NUMERIC(18,2),
      purchase_price_currency INTEGER NOT NULL REFERENCES currencies(id),
      sell_price NUMERIC(18,2),
      type INTEGER REFERENCES types(id) ON DELETE SET NULL,
      category INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      main_image INTEGER REFERENCES images(id) ON DELETE SET NULL,
      package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
      is_featured BOOLEAN NOT NULL DEFAULT false
    );
  `;

  // Added after the table already existed in deployed environments.
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;`;

  // barcode was originally BIGINT — widened to text since real-world
  // barcodes can have leading zeros or non-numeric formats that a numeric
  // column would silently mangle. Safe to re-run on an existing BIGINT
  // column (casts each value to its text representation) and a no-op if
  // the column is already VARCHAR.
  await sql`ALTER TABLE items ALTER COLUMN barcode TYPE VARCHAR(255) USING barcode::VARCHAR;`;

  // sell_price_currency used to be a per-item FK, but every item's sell
  // price is now always denominated in the single shop-wide
  // settings.sell_price_currency — dropping the redundant per-item column.
  // Existing sell_price/cost_price numbers are left as-is (not converted).
  await sql`ALTER TABLE items DROP COLUMN IF EXISTS sell_price_currency;`;

  const insertedItems = await Promise.all(
    items.map((item) => {
      return sql`
        INSERT INTO items (
          id, name, description, origin, barcode, status,
          cost_price,
          purchase_price, purchase_price_currency,
          sell_price,
          type, category, main_image, package_id
        )
        VALUES (
          ${item.id}, ${item.name}, ${item.description}, ${item.origin}, ${item.barcode}, ${item.status},
          ${item.cost_price},
          ${item.purchase_price}, ${item.purchase_price_currency},
          ${item.sell_price},
          ${item.type}, ${item.category}, ${item.main_image}, ${item.package_id}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  await sql`
    SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));
  `;
  console.log('items ok');
  return insertedItems;
}

async function seedBlueprints(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS blueprints (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      description VARCHAR(255),
      origin VARCHAR(255),
      barcode VARCHAR(255),
      status INTEGER NOT NULL,
      cost_price NUMERIC(18,2),
      purchase_price NUMERIC(18,2),
      purchase_price_currency INTEGER NOT NULL REFERENCES currencies(id),
      sell_price NUMERIC(18,2),
      type INTEGER REFERENCES types(id) ON DELETE SET NULL,
      category INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      main_image INTEGER REFERENCES images(id) ON DELETE SET NULL
    );
  `;

  await sql`ALTER TABLE blueprints ALTER COLUMN barcode TYPE VARCHAR(255) USING barcode::VARCHAR;`;

  // Same reasoning as items: sell price is now always in the single
  // shop-wide settings.sell_price_currency, so blueprints don't need their
  // own copy either.
  await sql`ALTER TABLE blueprints DROP COLUMN IF EXISTS sell_price_currency;`;

  console.log('blueprints ok');
}

async function seedSettings(sql: postgres.Sql) {
  // depends on: currencies, languages
  // NOTE: the diagram defines this table with no primary key at all.
  // Added a surrogate `id` here since Postgres requires one for a real table;
  // if this is meant to be a strict single-row config table, consider a
  // CHECK (id = 1) constraint instead, or just insert/enforce one row in app code.
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      show BOOLEAN NOT NULL DEFAULT false,
      show_sell_price BOOLEAN NOT NULL,
      show_cost_price BOOLEAN NOT NULL,
      show_purchase_price BOOLEAN NOT NULL,
      show_status_1 BOOLEAN NOT NULL,
      show_status_2 BOOLEAN NOT NULL,
      show_status_3 BOOLEAN NOT NULL,
      show_status_4 BOOLEAN NOT NULL,
      show_message VARCHAR(255),
      sell_price_currency INTEGER NOT NULL REFERENCES currencies(id),
      default_purchase_price_currency INTEGER NOT NULL REFERENCES currencies(id),
      use_sell_price BOOLEAN NOT NULL,
      use_package_fee_distribution BOOLEAN NOT NULL,
      use_barcode BOOLEAN NOT NULL,
      language INTEGER NOT NULL REFERENCES languages(id),
      name_category VARCHAR(255),
      name_status VARCHAR(255),
      name_type VARCHAR(255),
      name_package VARCHAR(255),
      name_item VARCHAR(255),
      display_profit BOOLEAN NOT NULL,
      display_sell_price BOOLEAN NOT NULL,
      display_purchase_price BOOLEAN NOT NULL,
      display_cost_price BOOLEAN NOT NULL,
      theme VARCHAR(255),
      owned_themes TEXT[] NOT NULL DEFAULT ARRAY['default', 'dark'],
      tried_themes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      theme_trial_expires_at TIMESTAMPTZ,
      storefront_name VARCHAR(255),
      storefront_tagline VARCHAR(255),
      storefront_density VARCHAR(20) NOT NULL DEFAULT 'dense',
      show_contact BOOLEAN NOT NULL DEFAULT false,
      contact_info VARCHAR(255),
      show_origin BOOLEAN NOT NULL DEFAULT false
    );
  `;

  // Added after the table already existed in deployed environments — safe to
  // re-run, and covers instances where the table was created before these
  // columns existed.
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS owned_themes TEXT[] NOT NULL DEFAULT ARRAY['default', 'dark'];`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS tried_themes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_trial_expires_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS storefront_name VARCHAR(255);`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS storefront_tagline VARCHAR(255);`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS storefront_density VARCHAR(20) NOT NULL DEFAULT 'dense';`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_contact BOOLEAN NOT NULL DEFAULT false;`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255);`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_origin BOOLEAN NOT NULL DEFAULT false;`;

  // Renamed from default_sell_price_currency: this is no longer just a
  // default seed for new items — with per-item sell_price_currency gone,
  // it's now the single authoritative currency every sell_price/cost_price
  // is denominated in. RENAME COLUMN isn't naturally idempotent, so guard
  // it with an existence check (safe to re-run once the rename has happened).
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'settings' AND column_name = 'default_sell_price_currency'
      ) THEN
        ALTER TABLE settings RENAME COLUMN default_sell_price_currency TO sell_price_currency;
      END IF;
    END $$;
  `;

  const insertedSettings = await Promise.all(
    settings.map((setting) => {
      return sql`
        INSERT INTO settings (
          id, show, show_sell_price, show_cost_price, show_purchase_price,
          show_status_1, show_status_2, show_status_3, show_status_4, show_message,
          sell_price_currency, default_purchase_price_currency,
          use_sell_price, use_package_fee_distribution, use_barcode,language,
          name_category, name_status, name_type, name_package, name_item,
          display_profit, display_sell_price, display_purchase_price, display_cost_price, theme,
          owned_themes, tried_themes, theme_trial_expires_at
        )
        VALUES (
          ${setting.id}, ${setting.show}, ${setting.show_sell_price}, ${setting.show_cost_price}, ${setting.show_purchase_price},
          ${setting.show_status_1}, ${setting.show_status_2}, ${setting.show_status_3}, ${setting.show_status_4}, ${setting.show_message},
          ${setting.sell_price_currency}, ${setting.default_purchase_price_currency},
          ${setting.use_sell_price}, ${setting.use_package_fee_distribution}, ${setting.use_barcode},${setting.language},
          ${setting.name_category}, ${setting.name_status}, ${setting.name_type}, ${setting.name_package}, ${setting.name_item},
          ${setting.display_profit}, ${setting.display_sell_price}, ${setting.display_purchase_price}, ${setting.display_cost_price}, ${setting.theme},
          ${setting.owned_themes ?? ['default', 'dark']}, ${setting.tried_themes ?? []}, ${setting.theme_trial_expires_at ?? null}
        )
        ON CONFLICT (id) DO NOTHING;

      `;
    }),
  );
  console.log('settings ok');
  return insertedSettings;
}

// ---------------------------------------------------------------------------
// Join tables — create/seed last, since each references two other tables
// ---------------------------------------------------------------------------

async function seedSalesItems(sql: postgres.Sql) {
  // depends on: sales, items
  await sql`
    CREATE TABLE IF NOT EXISTS sales_items (
      sales_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      PRIMARY KEY (sales_id, item_id)
    );
  `;

  const insertedSalesItems = await Promise.all(
    salesItems.map((salesItem) => {
      return sql`
        INSERT INTO sales_items (sales_id, item_id)
        VALUES (${salesItem.sales_id}, ${salesItem.item_id})
        ON CONFLICT (sales_id, item_id) DO NOTHING;
      `;
    }),
  );

  console.log('salesItems ok');
  return insertedSalesItems;
}

async function seedItemImages(sql: postgres.Sql) {
  // depends on: images, items
  await sql`
    CREATE TABLE IF NOT EXISTS item_images (
      image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      PRIMARY KEY (image_id, item_id)
    );
  `;

  const insertedItemImages = await Promise.all(
    itemImages.map((itemImage) => {
      return sql`
        INSERT INTO item_images (image_id, item_id)
        VALUES (${itemImage.image_id}, ${itemImage.item_id})
        ON CONFLICT (image_id, item_id) DO NOTHING;
      `;
    }),
  );

  console.log('itemImages ok');
  return insertedItemImages;
}


export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedCurrencies(sql),
      seedLanguages(sql),
      seedTypes(sql),
      seedCategories(sql),
      seedImages(sql),
      seedSales(sql),
      seedUsers(sql),
      seedPackages(sql),
      seedItems(sql),
      seedBlueprints(sql),
      seedSettings(sql),
      seedSalesItems(sql),
      seedItemImages(sql),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
