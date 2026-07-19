import { z } from 'zod';

export const createSaleSchema = z.object({
  name: z.string().optional(),
  date: z.string().date(), // "YYYY-MM-DD"
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;