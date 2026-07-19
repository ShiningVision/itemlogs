// lib/validation/account.ts
import { z } from 'zod';

// Whether current_password is actually required depends on whether the
// account has a password set at all (Google-only accounts don't) — that
// check happens in the action, not here.
export const changePasswordSchema = z.object({
  current_password: z.string().optional(),
  new_password: z.string().min(6),
  confirm_password: z.string().min(6),
});

export const changeEmailSchema = z.object({
  current_password: z.string().optional(),
  new_email: z.string().email(),
});
