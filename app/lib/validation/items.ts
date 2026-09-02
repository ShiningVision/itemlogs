// lib/validation/items.ts
import { z } from 'zod';

// .max(255) mirrors the items table's VARCHAR(255) columns (see
// app/api/setup/route.ts). Without it, a too-long value passed validation
// here and hit the database's own length constraint instead — the API
// route's generic catch-all then reported a vague "Failed to create item"
// instead of a message that actually says what's wrong.
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or fewer.'),
  description: z.string().optional(),
  location_id: z.number().int().nullable().optional(),
  barcode: z.string().max(255, 'Barcode must be 255 characters or fewer.').optional(),
  status: z.number().int(),
  cost_price: z.number().optional(),
  purchase_price: z.number().optional(),
  purchase_price_currency: z.number().int(),
  sell_price: z.number().optional(),
  // Many-to-many now (item_categories/item_types join tables) — an empty
  // array means "no categories"/"no types" (displayed as "Other"), same
  // meaning a null scalar used to have. Omitted entirely on a partial
  // update means "leave assignments as they are" (see updateItem in
  // app/lib/services/items.ts).
  type_ids: z.array(z.number().int()).optional(),
  category_ids: z.array(z.number().int()).optional(),
  main_image: z.number().int().nullable().optional(),
  package_id: z.number().int().nullable().optional(),
  is_featured: z.boolean().optional(),
  // Private, owner-only — gated on the dashboard by settings.use_secret_notes,
  // never included in any public storefront select (see PUBLIC_ITEM_SELECT
  // in app/lib/services/items.ts).
  notes: z.string().nullable().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;