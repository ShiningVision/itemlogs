// app/lib/actions/share-passwords.ts
'use server';

import bcrypt from 'bcrypt';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { createSharePasswordSchema } from '@/app/lib/validation/account';
import { getUser } from '@/app/lib/services/users';
import { insertSharePassword, deleteSharePasswordById } from '@/app/lib/services/share-passwords';

type ActionResult = { success: true } | { error: string };

// Owner-only, and requires re-entering the real admin password (not just an
// already-authenticated owner session) — minting a new credential that
// grants full dashboard access is exactly the kind of action that shouldn't
// be doable from an unattended, already-unlocked session alone.
export async function createSharePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'owner') {
    return { error: 'notAuthenticated' };
  }

  const raw = {
    admin_password: formData.get('admin_password') as string,
    new_password: formData.get('new_password') as string,
    label: (formData.get('label') as string) || undefined,
  };

  const parsed = createSharePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'invalid' };
  }

  const owner = await getUser();
  if (!owner || !owner.password) {
    return { error: 'notAuthenticated' };
  }

  const matches = await bcrypt.compare(parsed.data.admin_password, owner.password);
  if (!matches) {
    return { error: 'adminPasswordIncorrect' };
  }

  const hashed = await bcrypt.hash(parsed.data.new_password, 10);
  await insertSharePassword(hashed, parsed.data.label ?? null);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Owner-only. Deleting is immediate — see auth.ts's jwt callback, which
// re-checks a shared session's share_passwords row on every request, so
// this revokes access right away rather than waiting for the JWT to expire.
export async function deleteSharePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'owner') {
    return { error: 'notAuthenticated' };
  }

  const id = formData.get('id') as string;
  if (!id) {
    return { error: 'invalid' };
  }

  await deleteSharePasswordById(id);
  revalidatePath('/dashboard/settings');
  return { success: true };
}
