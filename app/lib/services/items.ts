// lib/services/items.ts
import { supabase } from '@/app/lib/db/client';
import type { CreateItemInput, UpdateItemInput } from '@/app/lib/validation/items';

export type ItemSort = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

type ItemFilters = {
  categoryIds?: number[];
  statuses?: number[];
  typeId?: number;     // single-select, used by admin items page
  typeIds?: number[];  // multi-select, used by storefront
  packageId?: number;  // single-select, used by storefront package filter
  sort?: ItemSort;
  limit?: number;
  offset?: number;
};

// No real category/type row is 0 (both are SERIAL PRIMARY KEY, starting at
// 1), so 0 is a safe sentinel for "Other" — a null category/type — in
// filter param lists. See applyNullableInFilter below for how a category/
// typeIds array containing this sentinel gets translated into a query that
// also matches NULL rows.
export const OTHER_FILTER_ID = 0;

function applyNullableInFilter(query: any, column: 'category' | 'type', ids: number[]) {
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

// Items no longer carry their own sell_price_currency — every item's
// sell_price/cost_price is denominated in the single, shop-wide
// settings.sell_price_currency. Only purchase_price still has a per-item
// currency (you can genuinely buy things in different currencies).
const ITEM_SELECT = `
  *,
  main_image_ref:main_image(url),
  category_ref:category(name),
  type_ref:type(name),
  purchase_currency:purchase_price_currency(currency_code, currency_symbol)
`;

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

export async function getItems(filters: ItemFilters = {}): Promise<{ items: any[]; totalCount: number }> {
  let query = supabase
    .from('items')
    .select(ITEM_SELECT, { count: 'exact' });

  query = applySort(query, filters.sort);

  if (filters.categoryIds !== undefined) query = applyNullableInFilter(query, 'category', filters.categoryIds);
  if (filters.statuses !== undefined) query = query.in('status', filters.statuses);
  if (filters.typeIds !== undefined) query = applyNullableInFilter(query, 'type', filters.typeIds);
  else if (filters.typeId !== undefined) {
    // The dashboard items page's type filter is a single-select dropdown
    // (unlike category, which is multi-select pills already routed through
    // applyNullableInFilter above) — special-case the "Other" sentinel here
    // too, so picking it filters for a null type instead of matching
    // nothing (no real type row has id 0).
    query = filters.typeId === OTHER_FILTER_ID ? query.is('type', null) : query.eq('type', filters.typeId);
  }
  if (filters.packageId !== undefined) query = query.eq('package_id', filters.packageId);

  if (filters.limit !== undefined && filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], totalCount: count ?? 0 };
}

// Tells the dashboard items page's filter bar whether to show an "Other"
// option at all — cheap head-only counts, no row data. Mirrors why the
// storefront's FilterSidebar only shows "Other" when it's non-empty (see
// getPublicCategoryCounts/getPublicTypeCounts): an admin with no
// uncategorized/untyped items shouldn't see a filter option that would
// always return nothing.
export async function getUncategorizedItemCounts(): Promise<{ category: number; type: number }> {
  const [categoryResult, typeResult] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).is('category', null),
    supabase.from('items').select('id', { count: 'exact', head: true }).is('type', null),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (typeResult.error) throw typeResult.error;
  return { category: categoryResult.count ?? 0, type: typeResult.count ?? 0 };
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

export async function getItemById(id: number) {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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

export async function createItem(input: CreateItemInput) {
  if (input.is_featured) {
    const count = await getFeaturedItemCount();
    if (count >= FEATURED_ITEM_CAP) {
      throw new Error('FEATURED_CAP_REACHED');
    }
  }

  const { data, error } = await supabase.from('items').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: number, input: UpdateItemInput) {
  if (input.is_featured) {
    const count = await getFeaturedItemCount(id);
    if (count >= FEATURED_ITEM_CAP) {
      throw new Error('FEATURED_CAP_REACHED');
    }
  }

  const { data, error } = await supabase.from('items').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
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
// category/type filters — cheap, single grouped query each. Not a full
// faceted-search recompute (which would need one query per active filter
// combination); good enough to tell a visitor roughly how big each bucket
// is before they click it.
export async function getPublicCategoryCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  if (allowedStatuses.length === 0) return {};
  const { data, error } = await supabase.from('items').select('category').in('status', allowedStatuses);
  if (error) throw error;

  // A null category counts under the OTHER_FILTER_ID bucket instead of
  // being dropped — those items are "Other" and get their own filter
  // option/count in FilterSidebar now, not just an invisible gap.
  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    const key = row.category ?? OTHER_FILTER_ID;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function getPublicTypeCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  if (allowedStatuses.length === 0) return {};
  const { data, error } = await supabase.from('items').select('type').in('status', allowedStatuses);
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    const key = row.type ?? OTHER_FILTER_ID;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function getFeaturedPublicItems(allowedStatuses: number[]) {
  if (allowedStatuses.length === 0) return [];

  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('is_featured', true)
    .in('status', allowedStatuses)
    .order('id', { ascending: false })
    .limit(FEATURED_ITEM_CAP);

  if (error) throw error;
  return data ?? [];
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
  return data;
}

export async function getUnassignedItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, main_image_ref:main_image(url), category_ref:category(name)')
    .is('package_id', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAvailableItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, main_image_ref:main_image(url), category_ref:category(name)')
    .eq('status', 1)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
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
    packageId?: number;
    sort?: ItemSort;
    limit?: number;
    offset?: number;
  },
  allowedStatuses: number[]
) {
  const statuses = filters.statuses?.length
    ? filters.statuses.filter((s) => allowedStatuses.includes(s))
    : allowedStatuses;

  return getItems({ ...filters, statuses });
}

