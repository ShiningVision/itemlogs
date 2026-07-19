import { z } from 'zod';

export const createBlueprintSchema = z.object({
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
});

export const updateBlueprintSchema = createBlueprintSchema.partial();

export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;