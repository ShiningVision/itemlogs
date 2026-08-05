import { supabase } from '../../lib/db/client';
import type { CreateSaleInput, UpdateSaleInput } from '../../lib/validation/sales';

// Dashboard "total sales" stat — cheap count-only query, no row fetch.
export async function getSalesTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSaleById(id: number) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createSale(input: CreateSaleInput) {
  const { data, error } = await supabase
    .from('sales')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSale(id: number, input: UpdateSaleInput) {
  const { data, error } = await supabase
    .from('sales')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSale(id: number) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSaleItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from('sales_items').select('sales_id');
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    counts[row.sales_id] = (counts[row.sales_id] ?? 0) + 1;
  }
  return counts;
}