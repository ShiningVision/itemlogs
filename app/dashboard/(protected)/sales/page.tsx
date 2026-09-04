// app/dashboard/(protected)/sales/page.tsx
import { getSales, getSaleItemCounts } from '@/app/lib/services/sales';
import { getSettings } from '@/app/lib/services/settings';
import { SalesTimeline } from '@/components/sales/SalesTimeline';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, paginateArray, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/widgets/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { QuickSellButton } from '@/components/sales/QuickSellButton';

const SALES_PAGE_SIZE = 20;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawSearchParams = await searchParams;
  const settings = await getSettings();
  // The whole Sales section only makes sense when sell prices are in use —
  // same switch (use_sell_price) that shows/hides sell-price fields and the
  // items page's sell-mode button. Direct-URL access is blocked server-side
  // here rather than just hiding the nav link, since hiding a link alone
  // wouldn't stop someone who already has a /dashboard/sales/... URL saved.
  if (!settings.use_sell_price) {
    redirect('/dashboard/items');
  }
  const [sales, itemCounts] = await Promise.all([getSales(), getSaleItemCounts()]);
  const t = await getTranslations('sales');

  // `sales` is already ordered newest-date-first. Paginating that sequence
  // directly means a date's entries can straddle a page boundary — the
  // timeline just re-shows that date's header at the top of the next page,
  // same tradeoff as the packages status grouping.
  const page = parsePage(rawSearchParams.page);
  const { pageItems, totalCount } = paginateArray(sales, page, SALES_PAGE_SIZE);
  const totalPages = getTotalPages(totalCount, SALES_PAGE_SIZE);

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{t('title')}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Link href="/dashboard/sales/new">
            <Button>
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              {t('addSale')}
            </Button>
          </Link>
          <QuickSellButton />
        </div>
      </div>

      {sales.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noSales')}</div>
      ) : (
        <SalesTimeline sales={pageItems} itemCounts={itemCounts} />
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/sales', rawSearchParams, p)} />
    </div>
  );
}
