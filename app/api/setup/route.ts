import bcrypt from 'bcrypt';
import postgres from 'postgres';
import {
  currencies,
  languages,
  types,
  categories,
  locations,
  images,
  sales,
  packages,
  documents,
  items,
  itemCategories,
  itemTypes,
  salesItems,
  itemImages,
  settings
} from '@/app/lib/placeholder-data';

// This is the first-run replacement for the old public, unauthenticated
// /seed route (which created the schema and inserted a fixed placeholder
// settings row + a hardcoded "123456" password, no matter who ran it, and
// with no "already set up" guard at all). This route:
//   - is only ever called from /setup, which itself checks the DB isn't
//     already configured before showing the form;
//   - re-checks that server-side too (a 409 if `settings` already has a
//     row), since the client-side check is just UX, not a real guard;
//   - takes the tenant's own password + starter-settings choices instead of
//     hardcoding them.
// Schema creation still needs a raw Postgres connection (POSTGRES_URL) —
// Supabase's PostgREST/Supabase-JS layer (used everywhere else in the app,
// via app/lib/db/client.ts) can't run CREATE TABLE.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const VALID_LANGUAGE_IDS = languages.map((l) => Number(l.id));
const VALID_CURRENCY_IDS = currencies.map((c) => Number(c.id));

interface SetupBody {
  password?: string;
  confirmPassword?: string;
  language?: number;
  currency?: number;
  needsSellPrice?: boolean;
  needsBarcode?: boolean;
  needsPackageFees?: boolean;
}

export async function POST(request: Request) {
  let body: SetupBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { password, confirmPassword, language, currency, needsSellPrice, needsBarcode, needsPackageFees } = body;

  if (typeof password !== 'string' || password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return Response.json({ error: 'Passwords do not match.' }, { status: 400 });
  }
  if (typeof language !== 'number' || !VALID_LANGUAGE_IDS.includes(language)) {
    return Response.json({ error: 'Invalid language.' }, { status: 400 });
  }
  if (typeof currency !== 'number' || !VALID_CURRENCY_IDS.includes(currency)) {
    return Response.json({ error: 'Invalid currency.' }, { status: 400 });
  }
  if (
    typeof needsSellPrice !== 'boolean' ||
    typeof needsBarcode !== 'boolean' ||
    typeof needsPackageFees !== 'boolean'
  ) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Guard against re-running setup on an already-configured tenant. The
  // /setup page itself checks this too before showing the form, but that's
  // just UX — this is the real guard, since nothing stops a direct POST.
  try {
    const existing = await sql`SELECT id FROM settings LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ error: 'This inventory is already set up.' }, { status: 409 });
    }
  } catch {
    // settings table doesn't exist yet — expected on a genuinely fresh
    // database, fall through to create everything.
  }

  // Captured once here and stored in settings.app_url rather than derived
  // per-request — a future mobile client hitting the API has no "current
  // page URL" of its own to infer this from, so it needs to be a plain
  // fetchable fact instead.
  const host = request.headers.get('host') ?? 'itemlogs.local';
  const appUrl = `https://${host}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await sql.begin(async (sql) => {
      // -----------------------------------------------------------------
      // Independent tables first (same dependency order as the old /seed).
      // -----------------------------------------------------------------
      //
      // Every table below gets RLS enabled immediately after it's created,
      // with zero policies defined. That means default-deny for Supabase's
      // `anon`/`authenticated` PostgREST roles — this app never uses either
      // (app/lib/db/client.ts talks to Supabase exclusively via the
      // service-role key, which always bypasses RLS regardless of policies,
      // and schema DDL here goes over a raw Postgres connection), so there
      // is no legitimate access path this could break. Without it, a plain
      // `CREATE TABLE` on Supabase is reachable by anyone with the project
      // URL and the anon key through the PostgREST API — the anon key is
      // meant to be public by Supabase's own design, so RLS (not key
      // secrecy) is the only thing that was ever supposed to gate that.
      await sql`
        CREATE TABLE IF NOT EXISTS currencies (
          id SERIAL PRIMARY KEY,
          currency_code VARCHAR(3) NOT NULL,
          currency_name VARCHAR(255) NOT NULL,
          currency_symbol VARCHAR(255) NOT NULL
        );
      `;
      await sql`ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        currencies.map(
          (c) => sql`
            INSERT INTO currencies (id, currency_code, currency_name, currency_symbol)
            VALUES (${c.id}, ${c.currency_code}, ${c.currency_name}, ${c.currency_symbol})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('currencies_id_seq', (SELECT MAX(id) FROM currencies));`;

      await sql`
        CREATE TABLE IF NOT EXISTS languages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(10) NOT NULL
        );
      `;
      await sql`ALTER TABLE languages ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        languages.map(
          (l) => sql`
            INSERT INTO languages (id, name, code)
            VALUES (${l.id}, ${l.name}, ${l.code})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('languages_id_seq', (SELECT MAX(id) FROM languages));`;

      await sql`
        CREATE TABLE IF NOT EXISTS types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `;
      await sql`ALTER TABLE types ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        types.map(
          (t) => sql`
            INSERT INTO types (id, name) VALUES (${t.id}, ${t.name})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('types_id_seq', (SELECT MAX(id) FROM types));`;

      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `;
      await sql`ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        categories.map(
          (c) => sql`
            INSERT INTO categories (id, name) VALUES (${c.id}, ${c.name})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));`;

      await sql`
        CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `;
      await sql`ALTER TABLE locations ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        locations.map(
          (l) => sql`
            INSERT INTO locations (id, name) VALUES (${l.id}, ${l.name})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));`;

      await sql`
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          url VARCHAR(255) NOT NULL
        );
      `;
      await sql`ALTER TABLE images ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        images.map(
          (i) => sql`
            INSERT INTO images (id, url) VALUES (${i.id}, ${i.url})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('images_id_seq', (SELECT MAX(id) FROM images));`;

      await sql`
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          date DATE NOT NULL
        );
      `;
      await sql`ALTER TABLE sales ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        sales.map(
          (s) => sql`
            INSERT INTO sales (id, name, date) VALUES (${s.id}, ${s.name}, ${s.date})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));`;

      // Single admin user — the tenant's own confirmed password. This route
      // only ever runs once (guarded above), so there's no need for an
      // ON CONFLICT clause: this INSERT either creates the one owner row or
      // this whole request already 409'd before reaching here.
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255),
          password VARCHAR(255),
          username VARCHAR(255) UNIQUE
        );
      `;
      // This is one of the two tables Supabase's automated scanner flags as
      // "sensitive columns exposed" (password hashes) when RLS is off —
      // enabling it here is what actually closes that, not just the
      // generic "table publicly accessible" finding.
      await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`;
      await sql`
        INSERT INTO users (name, password, username)
        VALUES ('Owner', ${hashedPassword}, 'owner');
      `;

      // Shareable passwords — additional credentials the owner can hand out
      // that grant full dashboard access without being the real account
      // (see app/lib/actions/share-passwords.ts). Empty until the owner
      // creates one from Account & Security.
      await sql`
        CREATE TABLE IF NOT EXISTS share_passwords (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          password_hash VARCHAR(255) NOT NULL,
          label VARCHAR(255),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      // The other table with password hashes in it — same reasoning as users.
      await sql`ALTER TABLE share_passwords ENABLE ROW LEVEL SECURITY;`;

      // -----------------------------------------------------------------
      // Tables with foreign keys to the above.
      // -----------------------------------------------------------------
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
          shipping_fee_currency INTEGER NOT NULL REFERENCES currencies(id),
          show_on_storefront BOOLEAN NOT NULL DEFAULT false
        );
      `;
      await sql`ALTER TABLE packages ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        packages.map(
          (p) => sql`
            INSERT INTO packages (
              id, name, description, departure_date, arrival_date,
              tariff, tariff_currency, shipping_fee, shipping_fee_currency, show_on_storefront
            )
            VALUES (
              ${p.id}, ${p.name}, ${p.description}, ${p.departure_date}, ${p.arrival_date},
              ${p.tariff}, ${p.tariff_currency}, ${p.shipping_fee}, ${p.shipping_fee_currency}, ${p.show_on_storefront}
            )
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('packages_id_seq', (SELECT MAX(id) FROM packages));`;

      // Package documents (receipts, certificates of authenticity, etc.) —
      // arbitrary file types (PDF, JPEG, ...) in Vercel Blob, kept out of the
      // `images` table/Gallery-image-picker machinery entirely since they
      // aren't shared/reusable across items the way images are: each
      // document belongs to exactly one package. Uploaded under a distinct
      // `documents/` Blob prefix (see app/lib/storage/documents.ts) so
      // Gallery's usage bar can split images vs. documents by prefix (see
      // app/lib/storage/blob-usage.ts).
      await sql`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
          url VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          content_type VARCHAR(100)
        );
      `;
      await sql`ALTER TABLE documents ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        documents.map(
          (d) => sql`
            INSERT INTO documents (id, package_id, url, filename, content_type)
            VALUES (${d.id}, ${d.package_id}, ${d.url}, ${d.filename}, ${d.content_type})
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      // No setval call — `documents` has no seed rows (see the empty array
      // in placeholder-data.ts), so there are no manually-assigned ids to
      // bump the sequence past. Same reasoning as the blueprints table above.

      await sql`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          description VARCHAR(255),
          location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
          barcode VARCHAR(255),
          status INTEGER NOT NULL,
          cost_price NUMERIC(18,2),
          purchase_price NUMERIC(18,2),
          purchase_price_currency INTEGER NOT NULL REFERENCES currencies(id),
          sell_price NUMERIC(18,2),
          -- No scalar type/category columns — both are many-to-many now,
          -- via the item_types/item_categories join tables created below
          -- (after items, since they reference items.id).
          main_image INTEGER REFERENCES images(id) ON DELETE SET NULL,
          package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
          is_featured BOOLEAN NOT NULL DEFAULT false,
          -- Private, owner-only text (e.g. where/who an item was actually
          -- bought from) — never included in any public/storefront select,
          -- gated on the dashboard by settings.use_secret_notes. No
          -- equivalent column on blueprints: a blueprint is a reusable
          -- template, not a specific purchased unit, so a purchase note
          -- doesn't apply to it.
          notes TEXT
        );
      `;
      await sql`ALTER TABLE items ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        items.map(
          (i) => sql`
            INSERT INTO items (
              id, name, description, location_id, barcode, status,
              cost_price, purchase_price, purchase_price_currency, sell_price,
              main_image, package_id
            )
            VALUES (
              ${i.id}, ${i.name}, ${i.description}, ${i.location_id}, ${i.barcode}, ${i.status},
              ${i.cost_price}, ${i.purchase_price}, ${i.purchase_price_currency}, ${i.sell_price},
              ${i.main_image}, ${i.package_id}
            )
            ON CONFLICT (id) DO NOTHING;
          `
        )
      );
      await sql`SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));`;

      await sql`
        CREATE TABLE IF NOT EXISTS blueprints (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          description VARCHAR(255),
          location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
          barcode VARCHAR(255),
          status INTEGER NOT NULL,
          cost_price NUMERIC(18,2),
          purchase_price NUMERIC(18,2),
          purchase_price_currency INTEGER NOT NULL REFERENCES currencies(id),
          sell_price NUMERIC(18,2),
          -- Same as items above — many-to-many via blueprint_types/
          -- blueprint_categories, no scalar columns here.
          main_image INTEGER REFERENCES images(id) ON DELETE SET NULL
        );
      `;
      await sql`ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;`;

      // Settings — the one real config row, built from the tenant's own
      // answers instead of a fixed placeholder.
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
          use_package_fees BOOLEAN NOT NULL,
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
          owned_themes TEXT[] NOT NULL DEFAULT ARRAY['default'],
          tried_themes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          theme_trial_expires_at TIMESTAMPTZ,
          storefront_name VARCHAR(255),
          storefront_tagline VARCHAR(255),
          storefront_density VARCHAR(20) NOT NULL DEFAULT 'dense',
          show_contact BOOLEAN NOT NULL DEFAULT false,
          contact_info VARCHAR(255),
          show_location BOOLEAN NOT NULL DEFAULT false,
          show_package_filter BOOLEAN NOT NULL DEFAULT false,
          -- Gates the private items.notes field (see items table above) —
          -- the toggle's own label/hint text calls this "secret notes" since
          -- that's the user-facing concept, even though the underlying
          -- column is just 'notes'.
          use_secret_notes BOOLEAN NOT NULL DEFAULT false,
          -- Gates a location filter section on the storefront, mirroring
          -- show_package_filter. Separate from show_location above, which
          -- only controls whether the assigned location shows on an item's
          -- own detail page.
          show_location_filter BOOLEAN NOT NULL DEFAULT false,
          -- Customizable label for "location," mirroring name_category /
          -- name_type / name_package below.
          name_location VARCHAR(255),
          app_url VARCHAR(255),
          -- Onboarding checklist progress (see OnboardingChecklist.tsx). All
          -- three are sticky: once a step is detected as done it's written
          -- here and never flips back to false, even if the underlying
          -- condition later becomes untrue again (e.g. the tenant deletes
          -- their only real item, or turns the storefront back off after
          -- going live once).
          checklist_added_item BOOLEAN NOT NULL DEFAULT false,
          checklist_named_storefront BOOLEAN NOT NULL DEFAULT false,
          checklist_went_live BOOLEAN NOT NULL DEFAULT false,
          -- Unassigned, reserved for future features. Once a tenant's
          -- database is provisioned there's no way to bulk-ALTER it later
          -- (see scripts/add-spare-toggles.sql for the one-time migration
          -- needed on already-existing tenants) — having these ready ahead
          -- of time means a new toggle-shaped feature can ship by just
          -- claiming one of these instead of needing a fresh migration
          -- rolled out to every tenant. Rename in place when one gets used
          -- (e.g. ALTER TABLE settings RENAME COLUMN spare_toggle_1 TO
          -- whatever_it_actually_is), and document what it became here.
          --
          -- spare_toggle_1: claimed — "Show featured items" (gates the
          -- storefront's spotlight strip, see StorefrontSpotlight /
          -- FeaturedItemsSection). Deliberately left named spare_toggle_1
          -- rather than renamed: a rename would need an ALTER TABLE RENAME
          -- COLUMN pushed out to every already-provisioned tenant database,
          -- which is exactly the migration this column exists to avoid.
          spare_toggle_1 BOOLEAN NOT NULL DEFAULT false,
          -- spare_toggle_2: claimed — "Show description" on the storefront
          -- item detail page (see the Toggle in SettingsForm.tsx and
          -- app/items/[id]/page.tsx). The column-level default stays false
          -- like every other spare toggle (so already-provisioned tenants
          -- get it off, same as show_location/show_sell_price/etc. default
          -- off for them) — new tenants get it on instead via an explicit
          -- true value in the INSERT below, not by changing this default.
          spare_toggle_2 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_3 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_4 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_5 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_6 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_7 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_8 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_9 BOOLEAN NOT NULL DEFAULT false,
          spare_toggle_10 BOOLEAN NOT NULL DEFAULT false
        );
      `;
      await sql`ALTER TABLE settings ENABLE ROW LEVEL SECURITY;`;
      await sql`
        INSERT INTO settings (
          id, show, show_sell_price, show_cost_price, show_purchase_price,
          show_status_1, show_status_2, show_status_3, show_status_4, show_message,
          sell_price_currency, default_purchase_price_currency,
          use_sell_price, use_package_fees, use_barcode, language,
          name_category, name_status, name_type, name_package, name_item,
          display_profit, display_sell_price, display_purchase_price, display_cost_price, theme,
          owned_themes, tried_themes, theme_trial_expires_at,
          storefront_name, storefront_tagline, storefront_density,
          show_contact, contact_info, show_location, show_package_filter,
          use_secret_notes, show_location_filter, name_location, app_url,
          checklist_added_item, checklist_named_storefront, checklist_went_live,
          spare_toggle_2
        )
        VALUES (
          1, false, ${needsSellPrice}, false, false,
          true, false, false, false, ${settings[0].show_message},
          ${currency}, ${currency},
          ${needsSellPrice}, ${needsPackageFees}, ${needsBarcode}, ${language},
          ${settings[0].name_category}, ${settings[0].name_status}, ${settings[0].name_type}, ${settings[0].name_package}, ${settings[0].name_item},
          false, false, false, false, 'default',
          ARRAY['default'], ARRAY[]::TEXT[], NULL,
          NULL, NULL, 'dense',
          false, NULL, false, false,
          false, false, NULL, ${appUrl},
          false, false, false,
          -- "Show description" — on by default for a brand-new tenant (see
          -- the spare_toggle_2 comment above); already-provisioned tenants
          -- are unaffected since this only runs once, on first setup.
          true
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      // -----------------------------------------------------------------
      // Join tables last.
      // -----------------------------------------------------------------
      await sql`
        CREATE TABLE IF NOT EXISTS sales_items (
          sales_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          PRIMARY KEY (sales_id, item_id)
        );
      `;
      await sql`ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        salesItems.map(
          (si) => sql`
            INSERT INTO sales_items (sales_id, item_id)
            VALUES (${si.sales_id}, ${si.item_id})
            ON CONFLICT (sales_id, item_id) DO NOTHING;
          `
        )
      );

      await sql`
        CREATE TABLE IF NOT EXISTS item_images (
          image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          PRIMARY KEY (image_id, item_id)
        );
      `;
      await sql`ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        itemImages.map(
          (ii) => sql`
            INSERT INTO item_images (image_id, item_id)
            VALUES (${ii.image_id}, ${ii.item_id})
            ON CONFLICT (image_id, item_id) DO NOTHING;
          `
        )
      );

      // category/type many-to-many — items side. Seeded from placeholder-data's
      // itemCategories/itemTypes (themselves derived from each seed item's
      // category_ids/type_ids, see placeholder-data.ts).
      await sql`
        CREATE TABLE IF NOT EXISTS item_categories (
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          PRIMARY KEY (item_id, category_id)
        );
      `;
      await sql`ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        itemCategories.map(
          (ic) => sql`
            INSERT INTO item_categories (item_id, category_id)
            VALUES (${ic.item_id}, ${ic.category_id})
            ON CONFLICT (item_id, category_id) DO NOTHING;
          `
        )
      );

      await sql`
        CREATE TABLE IF NOT EXISTS item_types (
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          type_id INTEGER NOT NULL REFERENCES types(id) ON DELETE CASCADE,
          PRIMARY KEY (item_id, type_id)
        );
      `;
      await sql`ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;`;
      await Promise.all(
        itemTypes.map(
          (it) => sql`
            INSERT INTO item_types (item_id, type_id)
            VALUES (${it.item_id}, ${it.type_id})
            ON CONFLICT (item_id, type_id) DO NOTHING;
          `
        )
      );

      // category/type many-to-many — blueprints side. No seed data (no
      // blueprints are seeded at all — see the blueprints table above),
      // just the empty tables ready for the app to write to.
      await sql`
        CREATE TABLE IF NOT EXISTS blueprint_categories (
          blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          PRIMARY KEY (blueprint_id, category_id)
        );
      `;
      await sql`ALTER TABLE blueprint_categories ENABLE ROW LEVEL SECURITY;`;

      await sql`
        CREATE TABLE IF NOT EXISTS blueprint_types (
          blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
          type_id INTEGER NOT NULL REFERENCES types(id) ON DELETE CASCADE,
          PRIMARY KEY (blueprint_id, type_id)
        );
      `;
      await sql`ALTER TABLE blueprint_types ENABLE ROW LEVEL SECURITY;`;
    });

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Setup failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
