// lib/validation/account.ts
import { z } from 'zod';

// Every account has a password now (Google/email sign-in was removed), so
// current_password is always required to change it.
export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  // No minimum length beyond "not empty" — the app has no encryption keyed
  // off this password (see auth.ts: it's only ever bcrypt-hashed and
  // compared), so an arbitrary length rule was just friction, not a real
  // security requirement.
  new_password: z.string().min(1, 'Password is required'),
  confirm_password: z.string().min(1, 'Password is required'),
});

// Creating a shareable password requires re-entering the real admin
// password, not just an already-authenticated owner session — see
// app/lib/actions/share-passwords.ts.
export const createSharePasswordSchema = z.object({
  admin_password: z.string().min(1),
  new_password: z.string().min(1, 'Password is required'),
  label: z.string().max(255).optional(),
});
