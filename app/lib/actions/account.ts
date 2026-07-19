// lib/actions/account.ts
'use server';

import bcrypt from 'bcrypt';
import { auth, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import { changePasswordSchema, changeEmailSchema } from '@/app/lib/validation/account';
import { getUserByEmail, isEmailTaken, updateUserPassword, updateUserEmail } from '@/app/lib/services/users';

type ActionResult = { success: true } | { error: string };

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'notAuthenticated' };
  }

  const raw = {
    current_password: (formData.get('current_password') as string) || undefined,
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

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return { error: 'notAuthenticated' };
  }

  if (user.password) {
    if (!parsed.data.current_password) {
      return { error: 'currentRequired' };
    }
    const matches = await bcrypt.compare(parsed.data.current_password, user.password);
    if (!matches) {
      return { error: 'currentIncorrect' };
    }
  }

  const hashed = await bcrypt.hash(parsed.data.new_password, 10);
  await updateUserPassword(user.id, hashed);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateEmailAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'notAuthenticated' };
  }

  const raw = {
    current_password: (formData.get('current_password') as string) || undefined,
    new_email: formData.get('new_email') as string,
  };

  const parsed = changeEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'invalidEmail' };
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return { error: 'notAuthenticated' };
  }

  if (user.password) {
    if (!parsed.data.current_password) {
      return { error: 'currentRequired' };
    }
    const matches = await bcrypt.compare(parsed.data.current_password, user.password);
    if (!matches) {
      return { error: 'currentIncorrect' };
    }
  }

  const newEmail = parsed.data.new_email.toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    return { error: 'sameEmail' };
  }

  if (await isEmailTaken(newEmail)) {
    return { error: 'emailInUse' };
  }

  await updateUserEmail(user.id, newEmail);

  // The session's email claim would otherwise go stale until the JWT is
  // refreshed, so sign out immediately and have the user log back in with
  // the new address rather than trying to patch the live session.
  await signOut({ redirectTo: '/login' });
  return { success: true }; // unreachable — signOut redirects
}
