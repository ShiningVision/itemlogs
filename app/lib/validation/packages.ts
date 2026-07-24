// lib/validation/packages.ts
import { z } from 'zod';

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
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