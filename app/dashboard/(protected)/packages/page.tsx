// app/dashboard/(protected)/packages/page.tsx
import { getPackages, getPackageItemCounts } from '@/app/lib/services/packages';
import { PackagesInfiniteList } from '@/components/packages/PackagesInfiniteList';
import { getPackageStatus, type PackageStatus } from '@/app/lib/packageStatus';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/widgets/Button';

const STATUS_RANK: Record<PackageStatus, number> = { pending: 0, in_transit: 1, arrived: 2 };

const STATUS_LABEL_KEY: Record<PackageStatus, string> = {
  pending: 'statusPending',
  in_transit: 'statusInTransit',
  arrived: 'statusArrived',
};

export default async function PackagesPage() {
  const [packages, itemCounts] = await Promise.all([
    getPackages(),
    getPackageItemCounts(),
  ]);
  const t = await getTranslations('packages');

  // Packages are cheap rows (no images), so rather than paginating separate
  // status groups independently, we sort the whole set by status (pending ->
  // in transit -> arrived, newest first within each) and reveal that combined
  // sequence progressively as the user scrolls.
  const sorted = [...packages].sort((a, b) => {
    const rankDiff = STATUS_RANK[getPackageStatus(a)] - STATUS_RANK[getPackageStatus(b)];
    return rankDiff !== 0 ? rankDiff : b.id - a.id;
  });

  const statusLabels: Record<PackageStatus, string> = {
    pending: t(STATUS_LABEL_KEY.pending),
    in_transit: t(STATUS_LABEL_KEY.in_transit),
    arrived: t(STATUS_LABEL_KEY.arrived),
  };

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{t('title')}</h1>
        <Link href="/dashboard/packages/new"><Button>{t('addPackage')}</Button></Link>
      </div>

      {packages.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noPackages')}</div>
      ) : (
        <PackagesInfiniteList sortedPackages={sorted} itemCounts={itemCounts} statusLabels={statusLabels} />
      )}
    </div>
  );
}
