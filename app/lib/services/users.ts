// app/lib/services/users.ts
import { supabase } from '@/app/lib/db/client';
import type { User } from '@/app/lib/definitions';

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isEmailTaken(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function updateUserPassword(id: string, hashedPassword: string) {
  const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', id);
  if (error) throw error;
}

export async function updateUserEmail(id: string, email: string) {
  const { error } = await supabase.from('users').update({ email }).eq('id', id);
  if (error) throw error;
}
