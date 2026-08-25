// lib/services/categories.ts
import { supabase } from '@/app/lib/db/client';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/app/lib/validation/categories';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
}

// Category is many-to-many with items now (item_categories join table) —
// no more scalar items.category column to select, so this counts join rows
// per category_id instead (see the identical pattern in
// app/lib/services/items.ts's getUncategorizedItemCounts/getPublicJoinCounts).
export async function getCategoryItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from('item_categories').select('category_id');
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of (data ?? []) as any[]) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function getCategoryById(id: number) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(input: CreateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: number, input: UpdateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: number) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}