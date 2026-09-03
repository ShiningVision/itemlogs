// lib/validation/settings.ts
import { z } from 'zod';

// All fields optional — PATCH sends only what's changing.
// No "create" schema: the row is seeded once and never inserted via the API.
export const updateSettingsSchema = z.object({
  show: z.boolean().optional(),
  show_sell_price: z.boolean().optional(),
  show_cost_price: z.boolean().optional(),
  show_purchase_price: z.boolean().optional(),
  show_status_1: z.boolean().optional(),
  show_status_2: z.boolean().optional(),
  show_status_3: z.boolean().optional(),
  show_status_4: z.boolean().optional(),
  show_message: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  sell_price_currency: z.number().int().optional(),
  default_purchase_price_currency: z.number().int().optional(),
  use_sell_price: z.boolean().optional(),
  use_package_fees: z.boolean().optional(),
  use_barcode: z.boolean().optional(),
  language: z.number().int().optional(),
  // .max(255) matches the settings table's VARCHAR(255) columns (see
  // app/api/setup/route.ts) — without it, a too-long value sailed straight
  // past validation and hit the database's own length constraint instead,
  // which threw uncaught from the autosave actions below (no try/catch
  // there at the time) instead of coming back as a normal validation
  // error. Same story for name_location further down.
  name_category: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  name_status: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  name_type: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  name_package: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  name_item: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  display_profit: z.boolean().optional(),
  display_sell_price: z.boolean().optional(),
  display_purchase_price: z.boolean().optional(),
  display_cost_price: z.boolean().optional(),
  theme: z.string().nullable().optional(),
  owned_themes: z.array(z.string()).optional(),
  tried_themes: z.array(z.string()).optional(),
  theme_trial_expires_at: z.string().nullable().optional(),
  storefront_name: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  storefront_tagline: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  storefront_density: z.enum(['showcase', 'dense']).optional(),
  show_contact: z.boolean().optional(),
  // Not fully validated as a real phone number (that needs a proper phone
  // number library, overkill here) — just loose enough to reject obvious
  // non-numbers while allowing the punctuation people naturally type
  // (spaces, dashes, parens, a leading +). Sanitized down to digits-only at
  // wa.me link-build time (see app/lib/whatsapp.ts), never at rest, so this
  // stays readable for the tenant to edit later.
  contact_whatsapp: z
    .string()
    .max(50, 'Must be 50 characters or fewer.')
    .refine((v) => v === '' || /^\+?[\d\s().-]{6,}$/.test(v), {
      message: 'Enter a phone number with country code, e.g. +1 555 123 4567.',
    })
    .nullable()
    .optional(),
  // Legacy free-text field, replaced by contact_whatsapp above — kept
  // valid to PATCH only so existing rows with a value already in it don't
  // fail if something still round-trips the full settings object; nothing
  // in the UI writes to it anymore.
  contact_info: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  show_location: z.boolean().optional(),
  show_package_filter: z.boolean().optional(),
  use_secret_notes: z.boolean().optional(),
  show_location_filter: z.boolean().optional(),
  name_location: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  show_featured_items: z.boolean().optional(),
  show_description: z.boolean().optional(),
  // Reserved for future features — see app/api/setup/route.ts. Kept valid
  // to PATCH here ahead of time so a future feature only needs to start
  // reading/writing one, not also wire up validation for it.
  spare_toggle_1: z.boolean().optional(),
  spare_toggle_2: z.boolean().optional(),
  spare_toggle_3: z.boolean().optional(),
  spare_toggle_4: z.boolean().optional(),
  spare_toggle_5: z.boolean().optional(),
  spare_toggle_6: z.boolean().optional(),
  spare_toggle_7: z.boolean().optional(),
  spare_toggle_8: z.boolean().optional(),
  // Same looseness reasoning as contact_whatsapp above — a real Telegram
  // username check needs the Telegram API to know for sure it exists, so
  // this only rejects obviously-wrong input. Stored without a leading @
  // preference either way; app/lib/telegram.ts strips one off if present.
  contact_telegram: z
    .string()
    .max(50, 'Must be 50 characters or fewer.')
    .refine((v) => v === '' || /^@?[A-Za-z0-9_]{3,32}$/.test(v), {
      message: 'Enter a Telegram username, e.g. yourusername.',
    })
    .nullable()
    .optional(),
  contact_email: z
    .string()
    .max(255, 'Must be 255 characters or fewer.')
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Enter a valid email address.',
    })
    .nullable()
    .optional(),
  // Instagram usernames allow periods/underscores, no @ required (same
  // strip-a-leading-@-if-present handling as Telegram — see
  // app/lib/instagram.ts).
  contact_instagram: z
    .string()
    .max(30, 'Must be 30 characters or fewer.')
    .refine((v) => v === '' || /^@?[A-Za-z0-9._]{1,30}$/.test(v), {
      message: 'Enter an Instagram username, e.g. yourusername.',
    })
    .nullable()
    .optional(),
  // Reserved for future free-text fields — same reasoning as the spare
  // toggles above, capped to match the VARCHAR(255) columns.
  spare_text_4: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_5: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_6: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_7: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_8: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_9: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
  spare_text_10: z.string().max(255, 'Must be 255 characters or fewer.').nullable().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;