// lib/validation/types.ts
import { z } from 'zod';

export const createTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updateTypeSchema = z.object({
  name: z.string().min(1).optional(),
});

export type CreateTypeInput = z.infer<typeof createTypeSchema>;
export type UpdateTypeInput = z.infer<typeof updateTypeSchema>;