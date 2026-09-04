// components/sales/SellReviewPanel.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/widgets/Button';
import type { SelectedSellItem } from './SellPicker';

// The explicit "confirm before this becomes real" step for selling items —
// this is where sell_price actually gets set/confirmed and status flips to
// Sold, via POST /api/v1/sales/[id]/items (see addSaleItem in
// app/lib/services/sales-items.ts). Nothing in SellPicker itself ever
// writes to the database; picking is just staging until this panel's
// Confirm button is pressed. Each row starts prefilled with the item's
// existing sell_price (if any) rather than forcing it to be re-entered from
// scratch — a tenant who already priced an item when logging it shouldn't
// have to retype that price at sale time, only override it when it's
// actually different.
export function SellReviewPanel({
  saleId,
  items,
  currencySymbol,
  onRemove,
  onClose,
  onConfirmed,
}: {
  saleId: number;
  items: SelectedSellItem[];
  currencySymbol: string;
  onRemove: (id: number) => void;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const t = useTranslations('sales');
  const [prices, setPrices] = useState<Record<number, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.sell_price !== null ? String(item.sell_price) : '']))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setPrice(id: number, value: string) {
    setPrices((prev) => ({ ...prev, [id]: value }));
  }

  // Live running total of whatever's currently typed into each price field
  // — not the items' original sell_price, so it stays accurate as prices
  // are adjusted before confirming. Blank/invalid fields count as 0 rather
  // than being skipped, so the total always reflects exactly what Confirm
  // is about to submit.
  const total = items.reduce((sum, item) => {
    const raw = prices[item.id]?.trim();
    const parsed = raw ? Number(raw) : 0;
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);

    const results = await Promise.all(
      items.map(async (item) => {
        const raw = prices[item.id]?.trim();
        const sellPrice = raw ? Number(raw) : null;
        try {
          const res = await fetch(`/api/v1/sales/${saleId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: item.id, sell_price: sellPrice }),
          });
          // A 409 means this item is already attached to this sale (e.g. a
          // double-submit) — the end state is what we wanted either way, so
          // treat it as success rather than a failure to retry.
          return { id: item.id, ok: res.ok || res.status === 409 };
        } catch {
          return { id: item.id, ok: false };
        }
      })
    );

    const failedCount = results.filter((r) => !r.ok).length;
    // Clear each succeeded item out of the selection as it lands, so a
    // partial failure leaves only the actual stragglers behind to retry —
    // not the whole batch again.
    for (const r of results) {
      if (r.ok) onRemove(r.id);
    }

    setIsSubmitting(false);

    if (failedCount === 0) {
      onConfirmed();
    } else {
      setError(t('sellReviewPartialError', { count: failedCount }));
    }
  }

  if (items.length === 0) {
    // Every item got confirmed and removed above but a failure count was 0
    // — or the caller re-opened this with nothing selected. Either way,
    // there's nothing left to review.
    onClose();
    return null;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 'var(--spacing-md)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '640px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-xs)' }}>{t('sellReviewTitle')}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>{t('sellReviewHint')}</p>

        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
            >
              <span style={{ flex: 1, fontWeight: 'var(--font-weight-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name || t('unnamedItem')}
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <span aria-hidden="true">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="sheet-input"
                  aria-label={t('sellPriceLabel', { name: item.name ?? t('unnamedItem') })}
                  value={prices[item.id] ?? ''}
                  onChange={(e) => setPrice(item.id, e.target.value)}
                  style={{ width: '100px' }}
                />
              </label>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={t('removeFromSelection')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: 'var(--spacing-sm) 0', borderTop: '1px solid var(--color-border)', marginBottom: 'var(--spacing-sm)' }}>
          <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('sellReviewTotal')}</span>
          <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
            {currencySymbol}{total.toFixed(2)}
          </span>
        </div>

        {error && <p className="setup-wizard-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {t('selectedCount', { count: items.length })}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button type="button" onClick={onClose}>{t('cancel')}</button>
            <Button onClick={handleConfirm} disabled={isSubmitting} style={{ background: 'var(--color-danger)' }}>
              {isSubmitting ? t('sellReviewConfirming') : t('sellReviewConfirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
