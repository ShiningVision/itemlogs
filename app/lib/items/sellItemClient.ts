// app/lib/items/sellItemClient.ts
'use client';

// DEAD CODE — no longer imported anywhere. This was the instant one-tap
// "mark sold" sequence used by the old items-page sell mode (ItemCard's
// per-item Sell button) and the old BarcodeSellScanner. Both were replaced
// by the sell-items picker on /dashboard/sales/[id]/sell (see
// components/sales/SellPicker.tsx and SellReviewPanel.tsx), which always
// goes through an explicit price-review confirm step instead of selling
// instantly — POST /api/v1/sales/[id]/items now takes an optional
// sell_price and sets status itself (see addSaleItem in
// app/lib/services/sales-items.ts), so nothing needs this two-call
// dance with a manual rollback anymore.
//
// Safe to delete this file entirely — kept only because file deletion
// isn't available in this environment.
//
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
