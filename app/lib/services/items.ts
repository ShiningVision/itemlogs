// lib/services/items.ts
import { supabase } from '@/app/lib/db/client';
import type { CreateItemInput, UpdateItemInput } from '@/app/lib/validation/items';

export type ItemSort = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

type ItemFilters = {
  categoryIds?: number[]; // multi-select, join-table backed (item_categories)
  typeIds?: number[];     // multi-select, join-table backed (item_types)
  statuses?: number[];
  locationIds?: number[]; // multi-select, used by both dashboard + storefront
  packageId?: number;  // single-select, used by storefront package filter
  // Fuzzy, typo-tolerant name search — used by both the dashboard items page
  // and the public storefront (see getPublicItems). See resolveSearchItemIds
  // / the search_items_by_name Postgres function this calls. Takes over
  // ordering and pagination entirely when set; see the branch in getItems
  // below.
  search?: string;
  sort?: ItemSort;
  limit?: number;
  offset?: number;
  // When true, uses PUBLIC_ITEM_SELECT instead of ITEM_SELECT (see below) —
  // set by getPublicItems, never by dashboard callers. Keeps items.notes
  // (private, gated by settings.use_secret_notes) structurally out of any
  // query that can reach the public storefront, rather than relying on it
  // just happening not to be rendered.
  public?: boolean;
};

// No real category/type/location row is 0 (all are SERIAL PRIMARY KEY,
// starting at 1), so 0 is a safe sentinel for "Other"/"no location" in
// filter param lists — an item with zero category (or type) join rows, or a
// null location_id.
export const OTHER_FILTER_ID = 0;

function applyNullableInFilter(query: any, column: 'location_id', ids: number[]) {
  const realIds = ids.filter((id) => id !== OTHER_FILTER_ID);
  const includesOther = ids.includes(OTHER_FILTER_ID);

  if (includesOther && realIds.length > 0) {
    return query.or(`${column}.in.(${realIds.join(',')}),${column}.is.null`);
  }
  if (includesOther) {
    return query.is(column, null);
  }
  return query.in(column, realIds);
}

// Category and type are many-to-many with items (item_categories/item_types
// join tables) — unlike location's scalar nullable FK, "which items match a
// set of category/type ids (possibly including the OTHER_FILTER_ID
// 'no categories at all' sentinel)" can't be expressed as a single .in()/
// .is(null) on the items table itself. This resolves that set of item ids
// up front (a couple of extra round trips) so the main items query can then
// just do `.in('id', ids)` like any other filter.
async function resolveJoinFilterItemIds(
  joinTable: 'item_categories' | 'item_types',
  idColumn: 'category_id' | 'type_id',
  ids: number[]
): Promise<number[]> {
  const realIds = ids.filter((id) => id !== OTHER_FILTER_ID);
  const includesOther = ids.includes(OTHER_FILTER_ID);

  const matchingIds = new Set<number>();

  if (realIds.length > 0) {
    const { data, error } = await supabase.from(joinTable).select('item_id').in(idColumn, realIds);
    if (error) throw error;
    for (const row of data ?? []) matchingIds.add(row.item_id as number);
  }

  if (includesOther) {
    const [{ data: allItems, error: allError }, { data: assignedRows, error: assignedError }] = await Promise.all([
      supabase.from('items').select('id'),
      supabase.from(joinTable).select('item_id'),
    ]);
    if (allError) throw allError;
    if (assignedError) throw assignedError;
    const assignedSet = new Set((assignedRows ?? []).map((r) => r.item_id as number));
    for (const row of allItems ?? []) {
      if (!assignedSet.has(row.id as number)) matchingIds.add(row.id as number);
    }
  }

  return Array.from(matchingIds);
}

// Items no longer carry their own sell_price_currency — every item's
// sell_price/cost_price is denominated in the single, shop-wide
// settings.sell_price_currency. Only purchase_price still has a per-item
// currency (you can genuinely buy things in different currencies).
//
// item_categories/item_types are nested joins — PostgREST returns each as
// an array of join rows (e.g. `item_categories: [{ category: {...} }, ...]`)
// which flattenItemJoins() below flattens into plain `item.categories` /
// `item.types` arrays for callers to use directly.
// Typed as plain `string` (not left as an inferred template-literal type) —
// Supabase-JS's generic `.select()` overload tries to parse a literal select
// string at the type level to build the result type, and its parser chokes
// on this shape's nested embedded resources (item_categories(category:
// categories(...))), which produced a ParserError type and failed the build.
// Widening to `string` here makes `.select()` fall back to its untyped
// overload instead — same runtime query, just not statically parsed.
const ITEM_SELECT: string = `
  *,
  main_image_ref:main_image(url),
  location_ref:location_id(name),
  item_categories(category:categories(id, name)),
  item_types(type:types(id, name)),
  purchase_currency:purchase_price_currency(currency_code, currency_symbol)
`;

// Same shape as ITEM_SELECT, minus `notes` — used by every query that can
// reach the public storefront (getPublicItems, getFeaturedPublicItems, and
// getItemById when called from app/items/[id]/page.tsx). `*` can't exclude a
// single column in PostgREST, so this enumerates the rest by hand; keep it
// in sync with the items table (see app/api/setup/route.ts).
// Also widened to `string` — see the comment above ITEM_SELECT.
const PUBLIC_ITEM_SELECT: string = `
  id, name, description, location_id, barcode, status,
  cost_price, purchase_price, purchase_price_currency, sell_price,
  main_image, package_id, is_featured,
  main_image_ref:main_image(url),
  location_ref:location_id(name),
  item_categories(category:categories(id, name)),
  item_types(type:types(id, name)),
  purchase_currency:purchase_price_currency(currency_code, currency_symbol)
`;

// Flattens the nested item_categories/item_types join arrays produced by
// ITEM_SELECT/PUBLIC_ITEM_SELECT into plain `categories`/`types` arrays —
// every caller of getItems/getItemById/etc. works with `item.categories`/
// `item.types` ({id, name}[]) rather than the raw join shape.
function flattenItemJoins<T extends Record<string, any>>(row: T): T {
  if (!row) return row;
  const categories = ((row as any).item_categories ?? [])
    .map((r: any) => r.category)
    .filter(Boolean);
  const types = ((row as any).item_types ?? [])
    .map((r: any) => r.type)
    .filter(Boolean);
  const { item_categories, item_types, ...rest } = row as any;
  return { ...rest, categories, types } as T;
}

// id doubles as "date added" — the items table has no created_at column,
// but id is a SERIAL PRIMARY KEY, so higher id reliably means added later.
// Every sort mode ends with an id tiebreak so results stay in a stable
// order even when many rows share the same name/price (and null values,
// e.g. items with no sell_price yet, always sort to the end).
function applySort(query: any, sort: ItemSort = 'newest') {
  switch (sort) {
    case 'oldest':
      return query.order('id', { ascending: true });
    case 'name_asc':
      return query.order('name', { ascending: true, nullsFirst: false }).order('id', { ascending: false });
    case 'name_desc':
      return query.order('name', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
    case 'price_asc':
      return query.order('sell_price', { ascending: true, nullsFirst: false }).order('id', { ascending: false });
    case 'price_desc':
      return query.order('sell_price', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
    case 'newest':
    default:
      return query.order('id', { ascending: false });
  }
}

// category/type/status/location filters are shared by both the normal path
// and the fuzzy-search path in getItems below — factored out so the two
// don't drift out of sync with each other.
//
// Returns `{ query }` — a plain wrapper object — rather than the query
// builder itself. Supabase's PostgrestFilterBuilder is "thenable" (that's
// what lets `await query` trigger execution), and returning a thenable
// directly from an async function makes JS's promise machinery assimilate
// it: it calls the builder's `.then()` as part of resolving this
// function's own promise, which executes the query right then and there
// and resolves `await applyCommonItemFilters(...)` to the *result*
// (`{data, error, count}`) instead of the still-chainable builder. Wrapping
// it in a plain object sidesteps that entirely.
async function applyCommonItemFilters(query: any, filters: ItemFilters) {
  if (filters.categoryIds !== undefined) {
    const ids = await resolveJoinFilterItemIds('item_categories', 'category_id', filters.categoryIds);
    query = query.in('id', ids.length > 0 ? ids : [-1]);
  }
  if (filters.typeIds !== undefined) {
    const ids = await resolveJoinFilterItemIds('item_types', 'type_id', filters.typeIds);
    query = query.in('id', ids.length > 0 ? ids : [-1]);
  }
  if (filters.statuses !== undefined) query = query.in('status', filters.statuses);
  if (filters.locationIds !== undefined) query = applyNullableInFilter(query, 'location_id', filters.locationIds);
  if (filters.packageId !== undefined) query = query.eq('package_id', filters.packageId);
  return { query };
}

// Fuzzy, typo-tolerant name search — calls the search_items_by_name()
// Postgres function (pg_trgm word_similarity under the hood; see the
// CREATE EXTENSION/CREATE INDEX/CREATE FUNCTION block in
// app/api/setup/route.ts for what it actually runs). Already ordered
// best-match-first and capped to a small result set server-side inside the
// function, so the caller can safely fetch every match in one go rather
// than needing its own pagination at this step.
//
// SQL injection isn't possible here regardless of what's in `term`:
// supabase.rpc() calls this as a typed Postgres function argument
// (search_term text) over PostgREST, sent as a bound parameter alongside
// the query — never spliced into a SQL string — and the function body
// itself is a plain parameterized `LANGUAGE sql` statement with no dynamic
// SQL (no EXECUTE/format()) that could reinterpret the value as anything
// other than a text literal. That said, this now also runs unauthenticated
// (the public storefront search, not just the dashboard), so
// SEARCH_TERM_MAX_LENGTH below is a defense-in-depth cap against a
// pathologically long term burning CPU on trigram similarity for no
// benefit — trimmed rather than rejected, since silently truncating a
// too-long search is harmless and friendlier than erroring on it.
const SEARCH_TERM_MAX_LENGTH = 100;

async function resolveSearchItemIds(term: string): Promise<number[]> {
  const searchTerm = term.slice(0, SEARCH_TERM_MAX_LENGTH);
  const { data, error } = await supabase.rpc('search_items_by_name', { search_term: searchTerm });
  if (error) throw error;
  return ((data ?? []) as { id: number }[]).map((row) => row.id);
}

export async function getItems(filters: ItemFilters = {}): Promise<{ items: any[]; totalCount: number }> {
  const searchTerm = filters.search?.trim();

  // A fuzzy search takes over ordering and pagination entirely — relevance
  // rank isn't something PostgREST's .order() can express server-side, so
  // instead: fetch the (already-capped, already-ranked) candidate ids,
  // apply the other filters on top via .in(), then reorder to match the
  // rank order and paginate in JS. `sort` is deliberately ignored while
  // searching — relevance is a more useful order than "newest"/"name" once
  // you've typed something to search for.
  if (searchTerm) {
    const rankedIds = await resolveSearchItemIds(searchTerm);
    if (rankedIds.length === 0) return { items: [], totalCount: 0 };

    let query = supabase
      .from('items')
      .select(filters.public ? PUBLIC_ITEM_SELECT : ITEM_SELECT)
      .in('id', rankedIds);
    ({ query } = await applyCommonItemFilters(query, filters));

    const { data, error } = await query;
    if (error) throw error;
    const rowsById = new Map(((data ?? []) as any[]).map((row) => [row.id, flattenItemJoins(row)]));
    const ordered = rankedIds.map((id) => rowsById.get(id)).filter((row: any): row is any => row !== undefined);

    const totalCount = ordered.length;
    const page =
      filters.limit !== undefined && filters.offset !== undefined
        ? ordered.slice(filters.offset, filters.offset + filters.limit)
        : ordered;

    return { items: page, totalCount };
  }

  let query = supabase
    .from('items')
    .select(filters.public ? PUBLIC_ITEM_SELECT : ITEM_SELECT, { count: 'exact' });

  query = applySort(query, filters.sort);
  ({ query } = await applyCommonItemFilters(query, filters));

  if (filters.limit !== undefined && filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  // Cast to `any[]` — the select string is widened to plain `string` (see
  // the comment on ITEM_SELECT) to dodge the type-level select parser, which
  // means Supabase-JS can no longer infer a real row shape here on its own.
  return { items: ((data ?? []) as any[]).map(flattenItemJoins), totalCount: count ?? 0 };
}

// Tells the dashboard items page's filter bar whether to show an "Other"
// option at all — cheap counts, no row data beyond join-table item ids.
// Mirrors why the storefront's FilterSidebar only shows "Other" when it's
// non-empty (see getPublicCategoryCounts/getPublicTypeCounts): an admin with
// no uncategorized/untyped items shouldn't see a filter option that would
// always return nothing. "Uncategorized"/"untyped" now means "zero
// item_categories/item_types rows for this item" rather than a null scalar.
export async function getUncategorizedItemCounts(): Promise<{ category: number; type: number; location: number }> {
  const [totalResult, categoryAssignedResult, typeAssignedResult, locationResult] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }),
    supabase.from('item_categories').select('item_id'),
    supabase.from('item_types').select('item_id'),
    supabase.from('items').select('id', { count: 'exact', head: true }).is('location_id', null),
  ]);
  if (totalResult.error) throw totalResult.error;
  if (categoryAssignedResult.error) throw categoryAssignedResult.error;
  if (typeAssignedResult.error) throw typeAssignedResult.error;
  if (locationResult.error) throw locationResult.error;

  const total = totalResult.count ?? 0;
  const categoryAssignedCount = new Set((categoryAssignedResult.data ?? []).map((r: any) => r.item_id)).size;
  const typeAssignedCount = new Set((typeAssignedResult.data ?? []).map((r: any) => r.item_id)).size;

  return {
    category: Math.max(total - categoryAssignedCount, 0),
    type: Math.max(total - typeAssignedCount, 0),
    location: locationResult.count ?? 0,
  };
}

// Batch existence check for the Excel importer — validating every row's
// `id` (if provided) really exists is part of the upfront scan, before any
// writes happen.
export async function getItemsByIds(ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();

  const { data, error } = await supabase.from('items').select('id').in('id', ids);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.id as number));
}

export async function getItemById(id: number, options: { public?: boolean } = {}) {
  const { data, error } = await supabase
    .from('items')
    .select(options.public ? PUBLIC_ITEM_SELECT : ITEM_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  // Cast to `any` — see the comment in getItems above.
  return flattenItemJoins(data as any);
}

// Featured items get a dedicated spotlight strip on the storefront — capped
// low so it stays a genuine highlight reel rather than just "the grid again,
// but first."
export const FEATURED_ITEM_CAP = 5;

export async function getFeaturedItemCount(excludeId?: number): Promise<number> {
  let query = supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('is_featured', true);
  if (excludeId !== undefined) query = query.neq('id', excludeId);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

// Replaces an item's item_categories/item_types rows wholesale
// (delete-then-insert) — simpler and safer than diffing old vs new sets,
// and category/type assignment is never high-frequency enough for that to
// matter perf-wise. No-op (just deletes, inserts nothing) when the id array
// is empty, i.e. "no categories"/"no types" for this item.
async function replaceItemCategories(itemId: number, categoryIds: number[]) {
  const { error: deleteError } = await supabase.from('item_categories').delete().eq('item_id', itemId);
  if (deleteError) throw deleteError;
  if (categoryIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('item_categories')
    .insert(categoryIds.map((category_id) => ({ item_id: itemId, category_id })));
  if (insertError) throw insertError;
}

async function replaceItemTypes(itemId: number, typeIds: number[]) {
  const { error: deleteError } = await supabase.from('item_types').delete().eq('item_id', itemId);
  if (deleteError) throw deleteError;
  if (typeIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('item_types')
    .insert(typeIds.map((type_id) => ({ item_id: itemId, type_id })));
  if (insertError) throw insertError;
}

export async function createItem(input: CreateItemInput) {
  if (input.is_featured) {
    const count = await getFeaturedItemCount();
    if (count >= FEATURED_ITEM_CAP) {
      throw new Error('FEATURED_CAP_REACHED');
    }
  }

  // category_ids/type_ids aren't real items columns — pulled out before the
  // insert and applied to the join tables once the item (and its id) exists.
  const { category_ids, type_ids, ...itemFields } = input;

  const { data, error } = await supabase.from('items').insert(itemFields).select().single();
  if (error) throw error;

  await Promise.all([
    replaceItemCategories(data.id, category_ids ?? []),
    replaceItemTypes(data.id, type_ids ?? []),
  ]);

  return getItemById(data.id);
}

export async function updateItem(id: number, input: UpdateItemInput) {
  if (input.is_featured) {
    const count = await getFeaturedItemCount(id);
    if (count >= FEATURED_ITEM_CAP) {
      throw new Error('FEATURED_CAP_REACHED');
    }
  }

  const { category_ids, type_ids, ...itemFields } = input;

  const { data, error } = await supabase.from('items').update(itemFields).eq('id', id).select().single();
  if (error) throw error;

  // Only touches the join tables when the caller actually sent category_ids/
  // type_ids — a PATCH that doesn't mention them (e.g. just flipping
  // is_featured) shouldn't wipe out the item's existing assignments.
  await Promise.all([
    category_ids !== undefined ? replaceItemCategories(id, category_ids) : Promise.resolve(),
    type_ids !== undefined ? replaceItemTypes(id, type_ids) : Promise.resolve(),
  ]);

  return getItemById(id);
}

// Dashboard "total items" stat — cheap count-only query, no row fetch.
export async function getItemsTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

// Onboarding checklist "added your first item" step. Every fresh tenant is
// seeded with placeholder items 1-4 (see app/lib/placeholder-data.ts), so a
// naive "items table has rows" check would always read as done. This checks
// for any item whose id isn't one of the seeded placeholder ids instead.
const PLACEHOLDER_ITEM_IDS = [1, 2, 3, 4];

export async function hasRealItem(): Promise<boolean> {
  const { count, error } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .not('id', 'in', `(${PLACEHOLDER_ITEM_IDS.join(',')})`);

  if (error) throw error;
  return (count ?? 0) > 0;
}

// Onboarding checklist "organized" step — every fresh tenant is seeded with
// placeholder categories/types/locations too (see app/lib/placeholder-data.ts),
// same reasoning as PLACEHOLDER_ITEM_IDS above. Checked as three parallel
// head:true counts rather than one query since categories/types/locations
// are separate tables with no shared key to join on.
const PLACEHOLDER_CATEGORY_IDS = [1, 2, 3, 4, 5];
const PLACEHOLDER_TYPE_IDS = [1, 2, 3, 4];
const PLACEHOLDER_LOCATION_IDS = [1, 2, 3, 4];

export async function hasCustomizedTaxonomy(): Promise<boolean> {
  const [categories, types, locations] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }).not('id', 'in', `(${PLACEHOLDER_CATEGORY_IDS.join(',')})`),
    supabase.from('types').select('id', { count: 'exact', head: true }).not('id', 'in', `(${PLACEHOLDER_TYPE_IDS.join(',')})`),
    supabase.from('locations').select('id', { count: 'exact', head: true }).not('id', 'in', `(${PLACEHOLDER_LOCATION_IDS.join(',')})`),
  ]);

  if (categories.error) throw categories.error;
  if (types.error) throw types.error;
  if (locations.error) throw locations.error;

  return (categories.count ?? 0) > 0 || (types.count ?? 0) > 0 || (locations.count ?? 0) > 0;
}

// Dashboard's Earnings vs Expenses chart (see EarningsExpensesChart.tsx).
// cost_price and sell_price are both always denominated in the single
// shop-wide settings.sell_price_currency (see settings.ts's SETTINGS_SELECT
// comment) — unlike purchase_price, neither needs per-item currency
// conversion, so this is a safe direct sum. Summed client-side rather than
// via a PostgREST aggregate (`sum()` in `.select()`) since aggregate
// functions aren't guaranteed enabled on every Supabase project; fetching
// just these two numeric columns for sold items is cheap regardless of
// inventory size for the scale this app targets.
export async function getSoldTotals(): Promise<{ totalCost: number; totalSell: number; soldCount: number }> {
  const SOLD_STATUS = 2;
  const { data, error } = await supabase
    .from('items')
    .select('cost_price, sell_price')
    .eq('status', SOLD_STATUS);

  if (error) throw error;

  const rows = data ?? [];
  return {
    totalCost: rows.reduce((sum, r) => sum + (r.cost_price ?? 0), 0),
    totalSell: rows.reduce((sum, r) => sum + (r.sell_price ?? 0), 0),
    soldCount: rows.length,
  };
}

// Dashboard's Recent Activity widget. Items have no created_at/updated_at
// column, so "recent" is approximated by id — SERIAL, so higher always
// means newer — rather than a true timestamp. That also means this can only
// show recently *added* items, not recently *sold* ones (no column records
// when a status change happened), which is why the widget is framed that
// way rather than promising a sold-activity feed it can't actually provide.
export async function getRecentItems(limit = 5): Promise<{ id: number; name: string | null; status: number }[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, status')
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getPublicItemsCount(allowedStatuses: number[]): Promise<number> {
  if (allowedStatuses.length === 0) return 0;
  const { count, error } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .in('status', allowedStatuses);

  if (error) throw error;
  return count ?? 0;
}

// Static (unfiltered-by-other-facets) per-option counts for the storefront's
// category/type filters. Not a full faceted-search recompute (which would
// need one query per active filter combination); good enough to tell a
// visitor roughly how big each bucket is before they click it.
//
// Now join-table backed: fetches the set of visible (status-allowed) item
// ids, then every item_categories row, and aggregates in JS rather than a
// single grouped SQL query — supabase-js has no clean COUNT-DISTINCT-per-
// group over a filtered join here, and this app's inventories are small
// enough that two round trips + an in-memory tally is the simpler,
// consistent-with-the-rest-of-this-file option (see
// resolveJoinFilterItemIds/getUncategorizedItemCounts above, same shape).
async function getPublicJoinCounts(
  joinTable: 'item_categories' | 'item_types',
  idColumn: 'category_id' | 'type_id',
  allowedStatuses: number[]
): Promise<Record<number, number>> {
  if (allowedStatuses.length === 0) return {};

  const [{ data: statusItems, error: statusError }, { data: joinRows, error: joinError }] = await Promise.all([
    supabase.from('items').select('id').in('status', allowedStatuses),
    supabase.from(joinTable).select(`item_id, ${idColumn}`),
  ]);
  if (statusError) throw statusError;
  if (joinError) throw joinError;

  const visibleItemIds = new Set((statusItems ?? []).map((row) => row.id as number));
  const assignedItemIds = new Set<number>();
  const counts: Record<number, number> = {};

  for (const row of (joinRows ?? []) as any[]) {
    const itemId = row.item_id as number;
    if (!visibleItemIds.has(itemId)) continue;
    assignedItemIds.add(itemId);
    const key = row[idColumn] as number;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // "Other" bucket — visible items with zero rows in this join table at all.
  let otherCount = 0;
  for (const id of visibleItemIds) {
    if (!assignedItemIds.has(id)) otherCount++;
  }
  if (otherCount > 0) counts[OTHER_FILTER_ID] = otherCount;

  return counts;
}

export async function getPublicCategoryCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  return getPublicJoinCounts('item_categories', 'category_id', allowedStatuses);
}

export async function getPublicTypeCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  return getPublicJoinCounts('item_types', 'type_id', allowedStatuses);
}

export async function getPublicLocationCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  if (allowedStatuses.length === 0) return {};
  const { data, error } = await supabase.from('items').select('location_id').in('status', allowedStatuses);
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    const key = row.location_id ?? OTHER_FILTER_ID;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// Minimal select shared by the dashboard's Featured Items manager (the
// currently-featured list) and its "Add items" picker (the not-yet-featured
// pool it adds from) — same shape as UNASSIGNED_ITEM_SELECT, no join-table
// category/type data needed for either view.
const FEATURED_MANAGER_ITEM_SELECT: string = 'id, name, main_image_ref:main_image(url)';

export async function getFeaturedItems() {
  const { data, error } = await supabase
    .from('items')
    .select(FEATURED_MANAGER_ITEM_SELECT)
    .eq('is_featured', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as any[];
}

// Only Available items are offered in the "Add items" picker — featuring
// something that's already Sold/Unavailable/Lost would just spotlight a
// visitor-page item nobody can actually get, so status 1 is the only
// sensible pool to add from (see AddFeaturedItemsModal).
export async function getUnfeaturedItems() {
  const { data, error } = await supabase
    .from('items')
    .select(FEATURED_MANAGER_ITEM_SELECT)
    .eq('is_featured', false)
    .eq('status', 1)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getFeaturedPublicItems(allowedStatuses: number[]) {
  if (allowedStatuses.length === 0) return [];

  const { data, error } = await supabase
    .from('items')
    .select(PUBLIC_ITEM_SELECT)
    .eq('is_featured', true)
    .in('status', allowedStatuses)
    .order('id', { ascending: false })
    .limit(FEATURED_ITEM_CAP);

  if (error) throw error;
  // Cast to `any[]` — see the comment in getItems above.
  return ((data ?? []) as any[]).map(flattenItemJoins);
}

export async function deleteItem(id: number) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function getItemsByPackageId(packageId: number) {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('package_id', packageId)
    .order('id', { ascending: false });

  if (error) throw error;
  // Cast to `any[]` — see the comment in getItems above.
  return ((data ?? []) as any[]).map(flattenItemJoins);
}

// Widened to `string` — see the comment above ITEM_SELECT for why (same
// nested-embedded-resource shape trips the type-level select parser).
const UNASSIGNED_ITEM_SELECT: string =
  'id, name, main_image_ref:main_image(url), item_categories(category:categories(id, name))';

export async function getUnassignedItems() {
  const { data, error } = await supabase
    .from('items')
    .select(UNASSIGNED_ITEM_SELECT)
    .is('package_id', null)
    .order('name', { ascending: true });

  if (error) throw error;
  // Cast to `any[]` — see the comment in getItems above.
  return ((data ?? []) as any[]).map(flattenItemJoins);
}

export async function getAvailableItems() {
  const { data, error } = await supabase
    .from('items')
    .select(UNASSIGNED_ITEM_SELECT)
    .eq('status', 1)
    .order('name', { ascending: true });

  if (error) throw error;
  // Cast to `any[]` — see the comment in getItems above.
  return ((data ?? []) as any[]).map(flattenItemJoins);
}

// Barcode-to-item lookup for the "scan to sell" flow (see
// components/items/BarcodeSellScanner.tsx) — only ever needs to consider
// available (status=1) items, since scanning an already-sold/reserved/lost
// item to sell it doesn't make sense. Exact match; barcode has no unique
// constraint in the schema, so this takes the first match (lowest id) if a
// barcode is somehow duplicated across multiple available items.
export async function getAvailableItemByBarcode(barcode: string): Promise<{ id: number; name: string | null } | null> {
  const { data, error } = await supabase
    .from('items')
    .select('id, name')
    .eq('status', 1)
    .eq('barcode', barcode)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPublicItems(
  filters: {
    categoryIds?: number[];
    statuses?: number[];
    typeIds?: number[];
    locationIds?: number[];
    packageId?: number;
    search?: string;
    sort?: ItemSort;
    limit?: number;
    offset?: number;
  },
  allowedStatuses: number[]
) {
  const statuses = filters.statuses?.length
    ? filters.statuses.filter((s) => allowedStatuses.includes(s))
    : allowedStatuses;

  return getItems({ ...filters, statuses, public: true });
}
