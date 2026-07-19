// lib/validation/items.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  origin: z.string().optional(),
  barcode: z.string().max(255).optional(),
  status: z.number().int(),
  cost_price: z.number().optional(),
  purchase_price: z.number().optional(),
  purchase_price_currency: z.number().int(),
  sell_price: z.number().optional(),
  type: z.number().int().nullable().optional(),
  category: z.number().int().nullable().optional(),
  main_image: z.number().int().nullable().optional(),
  package_id: z.number().int().nullable().optional(),
  is_featured: z.boolean().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;