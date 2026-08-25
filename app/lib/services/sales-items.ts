// lib/services/sales-items.ts
import { supabase } from '@/app/lib/db/client';

type ItemRow = {
  id: number;
  name: string | null;
  status: number;
  location_id: number | null;
  description: string | null;
  barcode: string | null;
  sell_price: number | null;
  purchase_price: number | null;
  cost_price: number | null;
  main_image_ref: { url: string } | null;
  purchase_currency: { currency_code: string } | null;
  // Many-to-many now — see app/lib/services/items.ts's flattenItemJoins.
  categories: { id: number; name: string | null }[];
  types: { id: number; name: string | null }[];
  location_ref: { name: string } | null;
};

// Items no longer have their own sell_price_currency — sell_price/cost_price
// are always in the shop-wide settings.sell_price_currency (resolved by the
// caller), so there's nothing to join here for sell currency anymore.
const SALE_ITEM_SELECT = `
  item_id,
  items(
    *,
    item_categories(category:categories(id, name)),
    item_types(type:types(id, name)),
    location_ref:location_id(name),
    main_image_ref:main_image(url),
    purchase_currency:purchase_price_currency(currency_code)
  )
`;

function flattenItemRowJoins(row: any): any {
  if (!row) return row;
  const categories = (row.item_categories ?? []).map((r: any) => r.category).filter(Boolean);
  const types = (row.item_types ?? []).map((r: any) => r.type).filter(Boolean);
  const { item_categories, item_types, ...rest } = row;
  return { ...rest, categories, types };
}

export async function getSaleItems(saleId: number): Promise<{ item_id: number; items: ItemRow }[]> {
  const { data, error } = await supabase
    .from('sales_items')
    .select(SALE_ITEM_SELECT)
    .eq('sales_id', saleId);

  if (error) throw error;

  // Same array-vs-object inference issue as item_images — normalize here.
  return (data ?? []).map((row: any) => ({
    item_id: row.item_id,
    items: flattenItemRowJoins(Array.isArray(row.items) ? row.items[0] : row.items),
  }));
}

export async function addSaleItem(saleId: number, itemId: number) {
  const { data, error } = await supabase
    .from('sales_items')
    .insert({ sales_id: saleId, item_id: itemId })
    .select()
    .single();

  if (error) throw error;

  const { error: statusError } = await supabase
    .from('items')
    .update({ status: 2 })
    .eq('id', itemId);

  if (statusError) throw statusError;

  return data;
}

export async function removeSaleItem(saleId: number, itemId: number) {
  const { error } = await supabase
    .from('sales_items')
    .delete()
    .eq('sales_id', saleId)
    .eq('item_id', itemId);

  if (error) throw error;

  // Removing an item from a sale un-sells it — revert back to available.
  const { error: statusError } = await supabase
    .from('items')
    .update({ status: 1 })
    .eq('id', itemId);

  if (statusError) throw statusError;
}