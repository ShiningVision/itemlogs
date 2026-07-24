// components/sales/SalesInfiniteTimeline.tsx
'use client';

import { Fragment, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFormatter } from 'next-intl';
import { SaleCard } from './SaleCard';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { useInfiniteScroll } from '@/app/lib/hooks/useInfiniteScroll';
import type { Sale } from '@/app/lib/definitions';

const PAGE_SIZE = 20;

export function SalesInfiniteTimeline({
  sales,
  itemCounts,
}: {
  sales: Sale[];
  itemCounts: Record<number, number>;
}) {
  const format = useFormatter();

  // Same "everything's already fetched, just reveal more" approach as
  // packages — sales rows are cheap and getSales() has no DB-level limit.
  const loadMore = useCallback(
    async (offset: number) => {
      const items = sales.slice(offset, offset + PAGE_SIZE);
      return { items, hasMore: offset + items.length < sales.length };
    },
    [sales]
  );

  const pathname = usePathname();
  // Memoized for the same reason as PackagesInfiniteList: a fresh array
  // reference every render would retrigger useInfiniteScroll's reset effect
  // in a loop.
  const initialItems = useMemo(() => sales.slice(0, PAGE_SIZE), [sales]);
  const initialHasMore = sales.length > PAGE_SIZE;
  const infiniteScroll = useInfiniteScroll({
    storageKey: pathname,
    initialItems,
    initialHasMore,
    loadMore,
  });

  // `sales` (and therefore the revealed slice) is already ordered
  // newest-date-first — group consecutive entries sharing a date into one
  // timeline "day" section.
  const groups: { date: string; sales: Sale[] }[] = [];
  for (const sale of infiniteScroll.items) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && currentGroup.date === sale.date) {
      currentGroup.sales.push(sale);
    } else {
      groups.push({ date: sale.date, sales: [sale] });
    }
  }

  return (
    <>
      <div className="timeline">
        {groups.map((group) => (
          <Fragment key={group.date}>
            <div className="timeline-row">
              <div className="timeline-rail">
                <div className="timeline-dot timeline-dot-date" />
                <div className="timeline-connector" />
              </div>
              <div className="timeline-content">
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                  {format.dateTime(new Date(`${group.date}T00:00:00`), {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
              </div>
            </div>

            {group.sales.map((sale) => (
              <div className="timeline-row fade-in-item" key={sale.id}>
                <div className="timeline-rail">
                  <div className="timeline-dot" />
                  <div className="timeline-connector" />
                </div>
                <div className="timeline-content">
                  <SaleCard sale={sale} itemCount={itemCounts[sale.id] ?? 0} />
                </div>
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      <InfiniteScrollSentinel
        sentinelRef={infiniteScroll.sentinelRef}
        hasMore={infiniteScroll.hasMore}
        isLoading={infiniteScroll.isLoading}
      />
    </>
  );
}
