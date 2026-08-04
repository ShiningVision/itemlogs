// app/lib/services/share-passwords.ts
import { supabase } from '@/app/lib/db/client';

export type SharePassword = {
  id: string;
  label: string | null;
  created_at: string;
};

// Never selects password_hash — the raw hash has no reason to leave the
// server, let alone reach the client for a list display.
export async function getSharePasswords(): Promise<SharePassword[]> {
  const { data, error } = await supabase
    .from('share_passwords')
    .select('id, label, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertSharePassword(passwordHash: string, label: string | null) {
  const { error } = await supabase
    .from('share_passwords')
    .insert({ password_hash: passwordHash, label });

  if (error) throw error;
}

export async function deleteSharePasswordById(id: string) {
  const { error } = await supabase.from('share_passwords').delete().eq('id', id);
  if (error) throw error;
}
