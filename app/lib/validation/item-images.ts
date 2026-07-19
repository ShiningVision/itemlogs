// lib/validation/item-images.ts
import { z } from 'zod';

export const addItemImageSchema = z.object({
  image_id: z.number().int(),
});

export type AddItemImageInput = z.infer<typeof addItemImageSchema>;