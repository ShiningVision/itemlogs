// components/items/SellModeControls.tsx
//
// DEAD CODE — no longer imported anywhere. This was the items page's
// "Enter sell mode" toggle: it locked the whole catalog into a filtered,
// per-card-instant-sell state via ?sell=1&statuses=1&saleId=. That's been
// retired in favor of a dedicated sell-items picker scoped to one sale at a
// time (see QuickSellButton.tsx on the sales list page, and
// /dashboard/sales/[id]/sell), which also adds a price-confirmation step
// this never had.
//
// Safe to delete this file entirely — kept only because file deletion isn't
// available in this environment.
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { buildUrl } from '@/app/lib/url';
import { Button } from '@/widgets/Button';

type Sale = { id: number; name: string | null; date: string };

export function SellModeControls({
  sellModeActive,
  saleId,
}: {
  sellModeActive: boolean;
  saleId?: number;
}) {
  const t = useTranslations('items');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sellModeActive) {
      fetch('/api/v1/sales')
        .then((res) => res.json())
        .then((res) => setSales(res.data ?? []));
    }
  }, [sellModeActive]);

  async function enableSellMode() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/sales');
      const { data: existingSales } = await res.json();
      const today = new Date().toISOString().slice(0, 10);

      let sale: Sale | undefined = existingSales.find((s: Sale) => s.date === today);
      let updatedSales = existingSales;

      if (!sale) {
        const createRes = await fetch('/api/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today }),
        });
        const created = await createRes.json();
        sale = created.data;
        updatedSales = [sale, ...existingSales];
      }

      setSales(updatedSales);
      router.push(
        buildUrl(pathname, searchParams, {
          sell: '1',
          statuses: '1',
          saleId: String(sale!.id),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  function disableSellMode() {
    router.push(buildUrl(pathname, searchParams, { sell: null, statuses: null, saleId: null }));
  }

  function handleSaleChange(id: string) {
    router.push(buildUrl(pathname, searchParams, { saleId: id }));
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
      <Button
        onClick={sellModeActive ? disableSellMode : enableSellMode}
        disabled={isLoading}
        style={{ background: 'var(--color-danger)' }}
        title={sellModeActive ? t('exitSellModeHint') : t('enterSellModeHint')}
      >
        {sellModeActive ? t('exitSellMode') : t('enterSellMode')}
      </Button>

      {sellModeActive && (
        <select
          value={saleId ?? ''}
          onChange={(e) => handleSaleChange(e.target.value)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
          }}
        >
          {sales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.date}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}