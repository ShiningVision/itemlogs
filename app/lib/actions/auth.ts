// app/lib/actions.ts
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { getTranslations } from 'next-intl/server';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      // These were hardcoded English strings — the login page renders
      // before any session exists, so it always falls back to
      // i18n/request.ts's DB-driven locale resolution (same as every other
      // unauthenticated page), same as the rest of the tenant's chosen
      // language.
      const t = await getTranslations('login');
      switch (error.type) {
        case 'CredentialsSignin':
          return t('invalidPassword');
        default:
          return t('genericError');
      }
    }
    throw error; // Next.js redirect() throws internally — must rethrow, not swallow
  }
}