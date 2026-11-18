// app/lib/sellableStatuses.ts
//
// The item statuses that can be sold: 1 Available, 3 Reserved, and 5 (the
// tenant-named custom status). Sold (2) is already sold, and 4 (Soon) hasn't
// arrived yet. Used by the sell picker page, its status filter, and the
// scan-to-sell barcode lookup.
export const SELLABLE_STATUSES = [1, 3, 5];
