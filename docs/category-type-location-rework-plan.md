# Category / Type / Location Rework — Implementation Plan

Scope: category and type become many-to-many with items (and blueprints); location
becomes a single-select lookup table like category/type are today, so items become
filterable by location; a new private `notes` field replaces location's old job of
holding confidential "where I bought this" text.

**Only new tenants get this schema.** Existing tenant databases have been marked
`legacy` and are intentionally left alone — no data migration, no dual-schema
runtime support, no `ALTER TABLE` against already-provisioned tenants anywhere in
this plan. Everything below only touches `app/api/setup/route.ts` (fresh-install
schema) and the app code that runs against it. This removes what would otherwise
have been the riskiest part of the rework.

## Target end state

- `items` and `blueprints` no longer have scalar `category`/`type`/`location`
  columns.
- New `locations` table (identical shape to `categories`/`types`).
- `items.location_id` / `blueprints.location_id` — nullable FK to `locations`,
  single-select, same pattern category/type use *today*.
- New join tables `item_categories`, `item_types`, `blueprint_categories`,
  `blueprint_types` — many-to-many.
- New `items.notes` (`TEXT`) — private, owner-only, never included in any public
  storefront query. Internally named `notes` (short); the settings toggle and its
  UI copy refer to it as "secret notes" since that's the user-facing concept.
  **No equivalent field on `blueprints`** (a blueprint is a reusable template, not
  a specific purchased unit — a purchase note doesn't apply to it).
- New settings columns, added directly (no spare-toggle indirection needed, since
  only fresh installs get them): `use_secret_notes BOOLEAN`,
  `show_location_filter BOOLEAN`, `name_location VARCHAR(255)` (customizable
  label, mirrors `name_category`/`name_type`).
- Existing `show_location` setting is kept, but narrows to "show the assigned
  location on the public item-detail page" (same behavior, different underlying
  data source — a lookup table instead of free text).

## Cross-cutting: `use_*`-gated Excel export

Decision: any export column controlled by a `use_*` toggle should only appear in
the export when that toggle is on. This applies to `notes` (gated by
`use_secret_notes`) and, while touching this logic, should also be applied
consistently to the existing `use_sell_price` (sell price column),
`use_package_fees` (tariff/shipping columns), and `use_barcode` (barcode column) —
today's `ITEM_EXPORT_COLUMNS` (`app/lib/items/exportItems.ts`) doesn't appear to
gate on these consistently, so this is a small standalone fix to make while
`notes` is added, not something new invented just for `notes`.

## Phase 0 — Settings groundwork

- Add `use_secret_notes`, `show_location_filter`, `name_location` directly to the
  `CREATE TABLE settings` block in `app/api/setup/route.ts`, and to the matching
  `INSERT INTO settings (...)` values list.
- Update `app/lib/validation/settings.ts` and the `Settings` type in
  `app/lib/definitions.ts` to include the three new fields.
- Settings UI copy: toggle label/hint text says "Secret notes" (e.g. "Enable
  secret notes on items"); the underlying setting key and item column are just
  `use_secret_notes` / `notes`.

## Phase 1 — Notes field

- Schema: `items.notes TEXT` (new column, `items` only).
- `ItemForm`: new textarea, rendered only when `settings.use_secret_notes` is
  true, with a small info icon (heroicons `InformationCircleIcon`) wrapped in
  `Tooltip` reading something like "Only visible to you — never shown on your
  storefront."
- Confirm/enforce the public item route (`app/items/[id]/page.tsx`) and any
  public-facing select in `app/lib/services/items.ts` never include `notes`. If
  dashboard and public queries currently share one select constant, split it so
  public queries can't accidentally pick it up.
- Excel export/import: `notes` becomes a normal `ITEM_EXPORT_COLUMNS` entry,
  gated by `use_secret_notes` per the cross-cutting rule above (owner-triggered
  export is private, not the storefront, so including it when the feature is on
  is fine).

## Phase 2 — Location lookup table

- Schema:
  ```sql
  CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
  );
  -- items and blueprints both get:
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL
  -- (in place of the old free-text `location VARCHAR(255)` column, which
  -- simply isn't part of the new CREATE TABLE)
  ```
- New `app/lib/services/locations.ts` — CRUD, mirrors `categories.ts` exactly
  (`getLocations`, `getLocationItemCounts`, `getLocationById`, `createLocation`,
  `updateLocation`, `deleteLocation`).
- New `app/api/v1/locations/route.ts` + `[id]/route.ts`, mirroring the
  categories API routes.
- One new shared component, **`components/reference-data/TagManagerModal.tsx`**
  — replaces today's page-based `ReferenceDataManager.tsx` entirely, and is the
  only new UI needed for all three of category/type/location. A modal fits
  this app's existing picker conventions much better than a dedicated page
  (images, blueprints, and barcode scanning are all already modal-based;
  nothing today is a full-page picker), and it sidesteps the "brand-new item
  has no id yet" problem entirely, since closing a modal has no return-path to
  worry about. Two modes, same component:
  - **`manage`** — opened with no item context (from a filter-bar button —
    see below). New-name input has a "Create" button. List sortable
    alphabetically or by usage, usage count shown per row. Delete reuses
    `ConfirmDialog`, but **skips it entirely when the tag has zero usage**
    (delete fires immediately) — no dialog needed if nothing is at stake. When
    usage > 0, shows the existing `ConfirmDialog` exactly as it behaves today,
    no extra confirmation step.
  - **`assign`** — opened from `ItemForm` (in both create and edit mode — see
    below) with `currentSelection` and a `multiSelect` flag. Same list
    content/search/create-new/delete affordances as `manage` mode (including
    the zero-usage-skips-dialog delete rule and usage counts, both cheap to
    include here too), but:
    - Single-select (location): clicking an unassigned row assigns it and
      closes the modal immediately. Typing a new name shows an "Assign" button
      (create the location + assign it + close, one action).
    - Multi-select (category/type, built in Phase 3/4, but the modal supports
      both from the start): rows are checkboxes, pre-checked for
      already-assigned values; a "Confirm" button applies the full set and
      closes.
    - **What "assign" does depends on whether the item has an id yet**: in
      edit mode (item already saved), confirming immediately PATCHes the item
      and the parent refreshes to show updated chips. In create mode (no id
      yet, `/dashboard/items/new`), confirming just updates `ItemForm`'s local
      state — nothing hits the server until the whole item is submitted, at
      which point the selected category/type/location ids ride along in that
      one create request. Creating a brand-new category/type/location *value*
      (not just assigning an existing one) always calls the API immediately
      regardless of item context, since the lookup-table row itself has to
      exist before anything can reference it — only the item↔tag link is
      deferred for unsaved items, not the tag itself.
  - Icons: `TrashIcon` for delete (Tooltip: "Delete"), `PlusIcon` for
    create/assign-new (Tooltip: "Create"/"Assign"), `CheckIcon` next to
    already-assigned rows, `XMarkIcon` to close the modal without changes.
- No new page routes at all. `app/dashboard/(protected)/categories/page.tsx`
  and `.../types/page.tsx` are retired in favor of `TagManagerModal` in
  `manage` mode — this is a small scope addition beyond strictly-new work, but
  keeps category/type/location consistent instead of two of the three being
  pages and one being a modal.
- "Manage X" entry points: small icon buttons (Tooltip-labeled) added directly
  into the dashboard `ItemFiltersBar`, next to each filter section
  (category/type/location), opening `TagManagerModal` in `manage` mode.
- `ItemForm` (create **and** edit mode — same component, per above): location's
  free-text `<input>` becomes a chip showing the assigned location's name (or
  "— none —"), which opens `TagAssignModal` on click, wrapped in `Tooltip`
  ("Assign a location"). This finally removes the need for any separate
  create-mode-only UI (no more "Phase 2.5" special case) — one control, one
  modal, for both flows.
- `applyBlueprint`: `location_id` copies across as a plain scalar, same as
  today.
- Storefront: `FilterSidebar` gets a third section (pill or checkbox, following
  the exact category/type pattern already there), gated by the new
  `show_location_filter` setting. New `getPublicLocationCounts` in `items.ts` —
  simpler than category/type's equivalent since location stays single-valued,
  still a flat group-count.
- Excel export/import: location switches from a raw string column to the same
  pattern category/type already use — export via a joined `location_ref.name`
  (falling back to "Other"), import via a new `resolveLocation` (lookup-or-create
  by name, "Other" → null), mirroring `resolveCategory`/`resolveType`.

## Phase 3 — Category many-to-many

- Schema:
  ```sql
  CREATE TABLE item_categories (
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, category_id)
  );
  -- same shape for blueprint_categories, referencing blueprints(id)
  ```
- Service layer (`app/lib/services/items.ts`) — the genuinely tricky part of
  the whole rework:
  - The item select needs a nested join to fetch each item's categories and
    flatten them into `item.categories: {id, name}[]`.
  - Filtering (today's `applyNullableInFilter`, a simple `.in()`/`.is(null)`)
    doesn't translate directly to a join table. Plan: a two-step ID-resolution
    helper — fetch matching `item_id`s from
    `item_categories.in('category_id', ids)`, separately resolve "no
    categories" (`OTHER_FILTER_ID`) if selected by diffing against the full
    item id set, union the two id lists, then filter the item query with
    `.in('id', unionedIds)`.
  - `getPublicCategoryCounts` / `getUncategorizedItemCounts`: rewritten to
    count distinct `item_id` per `category_id` from the join table (respecting
    the status filter), plus a separate "zero rows" count for the "Other"
    bucket.
- Validation: `category: z.number().int().nullable().optional()` becomes
  `category_ids: z.array(z.number().int()).optional()` (empty array = none) in
  both `items.ts` and `blueprints.ts` validation schemas.
- Item create/update API routes: after insert/update, replace that item's
  `item_categories` rows wholesale (delete-then-insert).
- `ItemForm` (create and edit, same component): category `<select>` becomes
  chips (one per assigned category, "+N more" if many) that open
  `TagManagerModal` in `assign` mode with `multiSelect` on, pre-checked to the
  current selection.
- Dashboard `ItemFiltersBar`: no structural change needed — category is
  already pill-based multi-select there; only the underlying query semantics
  change.
- Storefront `FilterSidebar`: no UI change either (already OR-filters category
  as a set) — only the service-layer plumbing above.
- Excel export: category column becomes a delimited list of names (see
  delimiter note below); no categories exports as `"Other"` for consistency
  with the current single-value convention.
- Excel import: `resolveCategory` becomes `resolveCategories` — split the cell
  on any recognized delimiter, trim each token, lookup-or-create each name; a
  lone `"Other"` token means empty array; `"Other"` mixed with real names is
  treated as invalid/ignored with a logged warning.
  - **Delimiter set**: split on `,`, the CJK fullwidth comma `，` (U+FF0C, used
    in Chinese/Japanese/Korean), and the CJK enumeration comma `、` (U+3001,
    used in Chinese/Japanese lists) — covers every locale currently seeded
    (`en`, `de`, `zh`, `ja`, `ko`, `fr`, `es`; none of the Latin-script
    locales use anything but `,`). Export always emits plain `,` regardless of
    the tenant's storefront language, since a spreadsheet column isn't
    localized — only import needs to be liberal about what it accepts.
- `applyBlueprint`: `categories` (array) copies wholesale into
  `form.categoryIds`.

## Phase 4 — Type many-to-many

Exact mirror of Phase 3 (`item_types`/`blueprint_types`, same service rework,
same chip UI, same `TagManagerModal` reuse, same import/export handling,
same delimiter set). This is also where today's inconsistency — category is
pills in `ItemFiltersBar`, type is still a single `<select>` — gets fixed,
since type becomes pills too. Close enough to Phase 3 to reasonably do in the
same session; kept separate here in case you'd rather validate the pattern on
category first.

## Phase 5 — Blueprint parity check

Explicit verification pass: `BlueprintPickerModal` → `applyBlueprint` →
`ItemForm` for `blueprint_categories`/`blueprint_types`/`location_id`
(remember: **no** `notes` field on blueprints), since blueprints mirror items'
schema but are a secondary feature that's easy to under-test mid-implementation.

## Phase 6 — Verification

Full click-through: create an item via the inline pickers, assign multiple
categories/types and one location on an existing item via the new pages,
confirm chips render on `ItemForm` and the public item page; confirm `notes`
never appears in any public response/select and is only exported when
`use_secret_notes` is on; confirm the same export-gating applies to
`use_sell_price`/`use_package_fees`/`use_barcode`; confirm storefront filtering
and counts for category/type/location all agree with each other; confirm an
Excel export → reimport round-trip preserves multi-category/type and location,
including CJK-delimiter cells; confirm zero-usage tags delete without a
dialog and in-use tags still show the existing warning; confirm the dashboard
type filter now behaves like category's pills.

## Rough sizing

- Phase 0 + 1 (settings + notes): small, ~1 session.
- Phase 2 (location): medium — new table, the new `TagManagerModal` pattern
  (which also retires the categories/types pages and is then just reused by
  Phases 3–4), storefront filter, import/export. ~1–2 sessions.
- Phase 3 + 4 (category/type many-to-many): the big one — schema, the trickiest
  filter/count query rework, `ItemForm`, import/export, `TagManagerModal`
  multi-select mode. ~2–3 sessions.
- Phase 5 (blueprint parity): small, ~0.5 session, mostly verification.
- Phase 6 (verification): ~0.5–1 session.
