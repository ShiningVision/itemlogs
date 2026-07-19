import { z } from 'zod';

export const addSaleItemSchema = z.object({
  item_id: z.number().int(),
});

export type AddSaleItemInput = z.infer<typeof addSaleItemSchema>;