// lib/services/items.ts
import { supabase } from '@/app/lib/db/client';
import type { CreateItemInput, UpdateItemInput } from '@/app/lib/validation/items';

type ItemFilters = {
  categoryIds?: number[];
  statuses?: number[];
  typeId?: number;     // single-select, used by admin items page
  typeIds?: number[];  // multi-select, used by storefront
  packageId?: number;  // single-select, used by storefront package filter
  limit?: number;
  offset?: number;
};

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

export async function getItems(filters: ItemFilters = {}): Promise<{ items: any[]; totalCount: number }> {
  let query = supabase
    .from('items')
    .select(ITEM_SELECT, { count: 'exact' })
    .order('id', { ascending: false });

  if (filters.categoryIds !== undefined) query = query.in('category', filters.categoryIds);
  if (filters.statuses !== undefined) query = query.in('status', filters.statuses);
  if (filters.typeIds !== undefined) query = query.in('type', filters.typeIds);
  else if (filters.typeId !== undefined) query = query.eq('type', filters.typeId);
  if (filters.packageId !== undefined) query = query.eq('package_id', filters.packageId);

  if (filters.limit !== undefined && filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], totalCount: count ?? 0 };
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

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    if (row.category !== null) counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return counts;
}

export async function getPublicTypeCounts(allowedStatuses: number[]): Promise<Record<number, number>> {
  if (allowedStatuses.length === 0) return {};
  const { data, error } = await supabase.from('items').select('type').in('status', allowedStatuses);
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    if (row.type !== null) counts[row.type] = (counts[row.type] ?? 0) + 1;
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

export async function getPublicItems(
  filters: { categoryIds?: number[]; statuses?: number[]; typeIds?: number[]; packageId?: number; limit?: number; offset?: number },
  allowedStatuses: number[]
) {
  const statuses = filters.statuses?.length
    ? filters.statuses.filter((s) => allowedStatuses.includes(s))
    : allowedStatuses;

  return getItems({ ...filters, statuses });
}

