// lib/services/sales-items.ts
import { supabase } from '@/app/lib/db/client';

type ItemRow = {
  id: number;
  name: string | null;
  status: number;
  location: string | null;
  description: string | null;
  barcode: string | null;
  sell_price: number | null;
  purchase_price: number | null;
  cost_price: number | null;
  main_image_ref: { url: string } | null;
  purchase_currency: { currency_code: string } | null;
  category_ref: { name: string } | null;
  type_ref: { name: string } | null;
};

// Items no longer have their own sell_price_currency — sell_price/cost_price
// are always in the shop-wide settings.sell_price_currency (resolved by the
// caller), so there's nothing to join here for sell currency anymore.
const SALE_ITEM_SELECT = `
  item_id,
  items(
    *,
    category_ref:category(name),
    type_ref:type(name),
    main_image_ref:main_image(url),
    purchase_currency:purchase_price_currency(currency_code)
  )
`;

export async function getSaleItems(saleId: number): Promise<{ item_id: number; items: ItemRow }[]> {
  const { data, error } = await supabase
    .from('sales_items')
    .select(SALE_ITEM_SELECT)
    .eq('sales_id', saleId);

  if (error) throw error;

  // Same array-vs-object inference issue as item_images — normalize here.
  return (data ?? []).map((row: any) => ({
    item_id: row.item_id,
    items: Array.isArray(row.items) ? row.items[0] : row.items,
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