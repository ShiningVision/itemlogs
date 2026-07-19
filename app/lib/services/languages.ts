// lib/services/languages.ts
import { supabase } from '../../lib/db/client';

export async function getLanguages() {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}