// lib/validation/locations.ts
import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
