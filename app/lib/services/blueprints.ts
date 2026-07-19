import { supabase } from '../../lib/db/client';
import type { CreateBlueprintInput, UpdateBlueprintInput } from '../../lib/validation/blueprints';

export async function getBlueprints() {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*, images:main_image(url)')
    .order('id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBlueprintById(id: number) {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*, images:main_image(url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBlueprint(input: CreateBlueprintInput) {
  const { data, error } = await supabase
    .from('blueprints')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlueprint(id: number, input: UpdateBlueprintInput) {
  const { data, error } = await supabase
    .from('blueprints')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlueprint(id: number) {
  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', id);

  if (error) throw error;
}