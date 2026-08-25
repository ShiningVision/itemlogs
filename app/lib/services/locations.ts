// lib/services/locations.ts
import { supabase } from '@/app/lib/db/client';
import type { CreateLocationInput, UpdateLocationInput } from '@/app/lib/validation/locations';

export async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getLocationItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from('items').select('location_id');
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    if (row.location_id !== null) {
      counts[row.location_id] = (counts[row.location_id] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getLocationById(id: number) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createLocation(input: CreateLocationInput) {
  const { data, error } = await supabase
    .from('locations')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLocation(id: number, input: UpdateLocationInput) {
  const { data, error } = await supabase
    .from('locations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLocation(id: number) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
