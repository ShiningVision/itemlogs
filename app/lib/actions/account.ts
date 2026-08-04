// lib/actions/account.ts
'use server';

import bcrypt from 'bcrypt';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { changePasswordSchema } from '@/app/lib/validation/account';
import { getUser, updateUserPassword } from '@/app/lib/services/users';

type ActionResult = { success: true } | { error: string };

// Changing the owner's real login password. Deliberately owner-only: a
// shared-password session must not be able to change (and thereby lock out)
// the real owner.
export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'owner') {
    return { error: 'notAuthenticated' };
  }

  const raw = {
    current_password: formData.get('current_password') as string,
    new_password: formData.get('new_password') as string,
    confirm_password: formData.get('confirm_password') as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'invalid' };
  }
  if (parsed.data.new_password !== parsed.data.confirm_password) {
    return { error: 'mismatch' };
  }

  const user = await getUser();
  if (!user || !user.password) {
    return { error: 'notAuthenticated' };
  }

  const matches = await bcrypt.compare(parsed.data.current_password, user.password);
  if (!matches) {
    return { error: 'currentIncorrect' };
  }

  const hashed = await bcrypt.hash(parsed.data.new_password, 10);
  await updateUserPassword(user.id, hashed);
  revalidatePath('/dashboard/settings');
  return { success: true };
}
