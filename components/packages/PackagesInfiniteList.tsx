// components/packages/PackagesInfiniteList.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { PackageCard } from './PackageCard';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { useInfiniteScroll } from '@/app/lib/hooks/useInfiniteScroll';
import { getPackageStatus, type PackageStatus } from '@/app/lib/packageStatus';
import { ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { Package } from '@/app/lib/definitions';

const PAGE_SIZE = 30;

const STATUS_ORDER: PackageStatus[] = ['pending', 'in_transit', 'arrived'];
const STATUS_ICON: Record<PackageStatus, typeof ClockIcon> = {
  pending: ClockIcon,
  in_transit: TruckIcon,
  arrived: CheckCircleIcon,
};

export function PackagesInfiniteList({
  sortedPackages,
  itemCounts,
  statusLabels,
}: {
  sortedPackages: Package[];
  itemCounts: Record<number, number>;
  statusLabels: Record<PackageStatus, string>;
}) {
  // The full sorted list is already in memory (packages are cheap rows), so
  // "loading more" is just revealing further slices of the array already
  // fetched by the server component — no extra network round trips.
  const loadMore = useCallback(
    async (offset: number) => {
      const items = sortedPackages.slice(offset, offset + PAGE_SIZE);
      return { items, hasMore: offset + items.length < sortedPackages.length };
    },
    [sortedPackages]
  );

  const pathname = usePathname();
  // `.slice()` must be memoized — a fresh array reference on every render
  // would retrigger useInfiniteScroll's reset effect (which depends on
  // initialItems by reference), causing an infinite render loop.
  const initialItems = useMemo(() => sortedPackages.slice(0, PAGE_SIZE), [sortedPackages]);
  const initialHasMore = sortedPackages.length > PAGE_SIZE;
  const infiniteScroll = useInfiniteScroll({
    storageKey: pathname,
    initialItems,
    initialHasMore,
    loadMore,
  });

  const grouped: Record<PackageStatus, Package[]> = { pending: [], in_transit: [], arrived: [] };
  for (const pkg of infiniteScroll.items) {
    grouped[getPackageStatus(pkg)].push(pkg);
  }

  return (
    <>
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        if (group.length === 0) return null;

        const StatusIcon = STATUS_ICON[status];

        return (
          <div key={status} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
              <StatusIcon style={{ width: '14px', height: '14px', color: 'var(--color-text-muted)' }} />
              <span className="settings-section-title" style={{ margin: 0, padding: 0 }}>
                {statusLabels[status]} ({group.length})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              {group.map((pkg) => (
                <div key={pkg.id} className="fade-in-item">
                  <PackageCard pkg={pkg} itemCount={itemCounts[pkg.id] ?? 0} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <InfiniteScrollSentinel
        sentinelRef={infiniteScroll.sentinelRef}
        hasMore={infiniteScroll.hasMore}
        isLoading={infiniteScroll.isLoading}
      />
    </>
  );
}
