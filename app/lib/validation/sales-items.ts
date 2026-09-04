import { z } from 'zod';

export const addSaleItemSchema = z.object({
  item_id: z.number().int(),
  // Optional — set from the sell-review step (see SellReviewPanel.tsx) so a
  // tenant can confirm/adjust the price at the actual moment of sale rather
  // than being stuck with whatever sell_price (if any) was saved on the item
  // when it was first logged. Omitted entirely (rather than sent as null)
  // when the caller doesn't want to touch the existing price — see
  // addSaleItem's comment for why that distinction matters.
  sell_price: z.number().nonnegative().nullable().optional(),
});

export type AddSaleItemInput = z.infer<typeof addSaleItemSchema>;