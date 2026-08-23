// app/dashboard/(protected)/packages/page.tsx
import { getPackages, getPackageItemCounts } from '@/app/lib/services/packages';
import { PackageCard } from '@/components/packages/PackageCard';
import { getPackageStatus, type PackageStatus } from '@/app/lib/packageStatus';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, paginateArray, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/widgets/Button';
import { ClockIcon, TruckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { Package } from '@/app/lib/definitions';

const PACKAGES_PAGE_SIZE = 30;

const STATUS_ORDER: PackageStatus[] = ['pending', 'in_transit', 'arrived'];
const STATUS_RANK: Record<PackageStatus, number> = { pending: 0, in_transit: 1, arrived: 2 };

const STATUS_ICON: Record<PackageStatus, typeof ClockIcon> = {
  pending: ClockIcon,
  in_transit: TruckIcon,
  arrived: CheckCircleIcon,
};

const STATUS_LABEL_KEY: Record<PackageStatus, string> = {
  pending: 'statusPending',
  in_transit: 'statusInTransit',
  arrived: 'statusArrived',
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawSearchParams = await searchParams;
  const [packages, itemCounts] = await Promise.all([
    getPackages(),
    getPackageItemCounts(),
  ]);
  const t = await getTranslations('packages');

  // Packages are cheap rows (no images), so rather than paginating separate
  // status groups independently, we sort the whole set by status (pending ->
  // in transit -> arrived, newest first within each) and paginate that
  // combined sequence. A status section can reappear at the top of the next
  // page if it straddles a page boundary — the same tradeoff paginated
  // activity feeds make when grouping by day.
  const sorted = [...packages].sort((a, b) => {
    const rankDiff = STATUS_RANK[getPackageStatus(a)] - STATUS_RANK[getPackageStatus(b)];
    return rankDiff !== 0 ? rankDiff : b.id - a.id;
  });

  const page = parsePage(rawSearchParams.page);
  const { pageItems, totalCount } = paginateArray(sorted, page, PACKAGES_PAGE_SIZE);
  const totalPages = getTotalPages(totalCount, PACKAGES_PAGE_SIZE);

  const grouped: Record<PackageStatus, Package[]> = { pending: [], in_transit: [], arrived: [] };
  for (const pkg of pageItems) {
    grouped[getPackageStatus(pkg)].push(pkg);
  }

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{t('title')}</h1>
        <Link href="/dashboard/packages/new">
          <Button>
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            {t('addPackage')}
          </Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noPackages')}</div>
      ) : (
        STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;

          const StatusIcon = STATUS_ICON[status];

          return (
            <div key={status} style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <StatusIcon style={{ width: '14px', height: '14px', color: 'var(--color-text-muted)' }} />
                <span className="settings-section-title" style={{ margin: 0, padding: 0 }}>
                  {t(STATUS_LABEL_KEY[status])} ({group.length})
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                {group.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} itemCount={itemCounts[pkg.id] ?? 0} />
                ))}
              </div>
            </div>
          );
        })
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/packages', rawSearchParams, p)} />
    </div>
  );
}
