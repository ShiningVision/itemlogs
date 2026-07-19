// lib/services/currencies.ts
import { supabase } from '../../lib/db/client';

export async function getCurrencies() {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .order('currency_code', { ascending: true });

  if (error) throw error;
  return data;
}