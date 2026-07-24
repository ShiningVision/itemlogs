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
  show_message: z.string().max(255).nullable().optional(),
  sell_price_currency: z.number().int().optional(),
  default_purchase_price_currency: z.number().int().optional(),
  use_sell_price: z.boolean().optional(),
  use_package_fees: z.boolean().optional(),
  use_barcode: z.boolean().optional(),
  language: z.number().int().optional(),
  name_category: z.string().nullable().optional(),
  name_status: z.string().nullable().optional(),
  name_type: z.string().nullable().optional(),
  name_package: z.string().nullable().optional(),
  name_item: z.string().nullable().optional(),
  display_profit: z.boolean().optional(),
  display_sell_price: z.boolean().optional(),
  display_purchase_price: z.boolean().optional(),
  display_cost_price: z.boolean().optional(),
  theme: z.string().nullable().optional(),
  owned_themes: z.array(z.string()).optional(),
  tried_themes: z.array(z.string()).optional(),
  theme_trial_expires_at: z.string().nullable().optional(),
  storefront_name: z.string().max(255).nullable().optional(),
  storefront_tagline: z.string().max(255).nullable().optional(),
  storefront_density: z.enum(['showcase', 'dense']).optional(),
  show_contact: z.boolean().optional(),
  contact_info: z.string().max(255).nullable().optional(),
  show_origin: z.boolean().optional(),
  show_package_filter: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;