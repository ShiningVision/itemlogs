// lib/services/types.ts
import { supabase } from '../../lib/db/client';
import type { CreateTypeInput, UpdateTypeInput } from '../../lib/validation/types';

export async function getTypes() {
  const { data, error } = await supabase
    .from('types')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
}

// Type is many-to-many with items now (item_types join table) — no more
// scalar items.type column to select, so this counts join rows per type_id
// instead (see the identical pattern in app/lib/services/categories.ts's
// getCategoryItemCounts).
export async function getTypeItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from('item_types').select('type_id');
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of (data ?? []) as any[]) {
    counts[row.type_id] = (counts[row.type_id] ?? 0) + 1;
  }
  return counts;
}

export async function getTypeById(id: number) {
  const { data, error } = await supabase
    .from('types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createType(input: CreateTypeInput) {
  const { data, error } = await supabase
    .from('types')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateType(id: number, input: UpdateTypeInput) {
  const { data, error } = await supabase
    .from('types')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteType(id: number) {
  const { error } = await supabase
    .from('types')
    .delete()
    .eq('id', id);

  if (error) throw error;
}