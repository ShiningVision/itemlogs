// app/lib/items/sellItemClient.ts
'use client';

// Shared client-side "mark this item sold and attach it to a sale"
// sequence, used by both ItemCard's per-item Sell button and the
// barcode scan-to-sell flow (components/items/BarcodeSellScanner.tsx).
//
// Two separate API calls, not one combined endpoint, because sales_items is
// its own join-table resource with its own POST route. If the second call
// fails, the status change is rolled back so the item isn't left "sold"
// without actually being on a sale.
export async function sellItemToSale(itemId: number, saleId: number): Promise<boolean> {
  const statusRes = await fetch(`/api/v1/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 2 }),
  });
  if (!statusRes.ok) return false;

  const saleRes = await fetch(`/api/v1/sales/${saleId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId }),
  });
  if (!saleRes.ok) {
    await fetch(`/api/v1/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 1 }),
    });
    return false;
  }

  return true;
}
