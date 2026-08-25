import { z } from 'zod';

export const createBlueprintSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  location_id: z.number().int().nullable().optional(),
  barcode: z.string().max(255).optional(),
  status: z.number().int(),
  cost_price: z.number().optional(),
  purchase_price: z.number().optional(),
  purchase_price_currency: z.number().int(),
  sell_price: z.number().optional(),
  // Many-to-many now (blueprint_categories/blueprint_types join tables) —
  // same convention as items' category_ids/type_ids.
  type_ids: z.array(z.number().int()).optional(),
  category_ids: z.array(z.number().int()).optional(),
  main_image: z.number().int().nullable().optional(),
});

export const updateBlueprintSchema = createBlueprintSchema.partial();

export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;