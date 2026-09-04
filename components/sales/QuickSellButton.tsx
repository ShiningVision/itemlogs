// components/sales/QuickSellButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/widgets/Button';

type Sale = { id: number; date: string };

// The one-click "just let me start selling" entry point — finds (or, on a
// fresh day, creates) today's dated sale and drops the tenant straight into
// picking items for it, without making them go create a sale by hand
// first. This is what used to be the items page's "Enter sell mode" button
// (see SellModeControls.tsx, now dead code): same one-click convenience,
// just landing on the sell-items picker for a real sale instead of
// toggling the whole items catalog into a different mode.
//
// Two visual variants, same behavior: 'button' is the standalone danger-red
// CTA used on the sales list toolbar; 'pill' matches the plain
// .dashboard-quick-action-btn look of every other entry in the dashboard's
// Quick Actions card (see CopyStorefrontLinkButton for the same pattern),
// so it doesn't stick out as a differently-styled one-off there.
export function QuickSellButton({ variant = 'button' }: { variant?: 'button' | 'pill' }) {
  const t = useTranslations('sales');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/sales');
      const { data: existingSales } = (await res.json()) as { data: Sale[] };
      const today = new Date().toISOString().slice(0, 10);

      let sale: Sale | undefined = existingSales?.find((s) => s.date === today);
      if (!sale) {
        const createRes = await fetch('/api/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today }),
        });
        const created = await createRes.json();
        sale = created.data;
      }

      router.push(`/dashboard/sales/${sale!.id}/sell`);
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === 'pill') {
    return (
      <button type="button" className="dashboard-quick-action-btn" onClick={handleClick} disabled={isLoading} title={t('quickSellHint')}>
        <BoltIcon aria-hidden="true" />
        {isLoading ? t('startingSale') : t('quickSell')}
      </button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} style={{ background: 'var(--color-danger)' }} title={t('quickSellHint')}>
      <BoltIcon style={{ width: '18px', height: '18px' }} />
      {isLoading ? t('startingSale') : t('quickSell')}
    </Button>
  );
}
