// lib/validation/packages.ts
import { z } from 'zod';

// .max(255) mirrors the packages table's VARCHAR(255) columns (see
// app/api/setup/route.ts) — see the matching comment in
// app/lib/validation/items.ts for why this matters.
export const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or fewer.'),
  description: z.string().max(255, 'Description must be 255 characters or fewer.').nullable().optional(),
  departure_date: z.string().date().nullable().optional(),
  arrival_date: z.string().date().nullable().optional(),
  tariff: z.number().nullable().optional(),
  tariff_currency: z.number().int(),
  shipping_fee: z.number().nullable().optional(),
  shipping_fee_currency: z.number().int(),
  show_on_storefront: z.boolean().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;