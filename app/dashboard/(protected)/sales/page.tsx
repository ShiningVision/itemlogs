// app/dashboard/(protected)/sales/page.tsx
import { getSales, getSaleItemCounts } from '@/app/lib/services/sales';
import { SalesInfiniteTimeline } from '@/components/sales/SalesInfiniteTimeline';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/widgets/Button';

export default async function SalesPage() {
  const [sales, itemCounts] = await Promise.all([getSales(), getSaleItemCounts()]);
  const t = await getTranslations('sales');

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{t('title')}</h1>
        <Link href="/dashboard/sales/new"><Button>{t('addSale')}</Button></Link>
      </div>

      {sales.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noSales')}</div>
      ) : (
        <SalesInfiniteTimeline sales={sales} itemCounts={itemCounts} />
      )}
    </div>
  );
}
