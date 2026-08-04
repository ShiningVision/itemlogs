// app/lib/services/users.ts
import { supabase } from '@/app/lib/db/client';
import type { User } from '@/app/lib/definitions';

// Single-tenant app — the users table holds exactly one real account (the
// owner, created during /setup). No email/username-based lookup needed.
export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserPassword(id: string, hashedPassword: string) {
  const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', id);
  if (error) throw error;
}
