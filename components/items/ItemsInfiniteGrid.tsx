// components/items/ItemsInfiniteGrid.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ItemCard } from './ItemCard';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { useInfiniteScroll } from '@/app/lib/hooks/useInfiniteScroll';
import type { Settings } from '@/app/lib/definitions';

const PAGE_SIZE = 24;

export function ItemsInfiniteGrid({
  items,
  hasMore,
  settings,
  showDeleteButton = false,
  sellMode = false,
  saleId,
  categoryIds,
  statuses,
  typeId,
}: {
  items: any[];
  hasMore: boolean;
  settings: Settings;
  showDeleteButton?: boolean;
  sellMode?: boolean;
  saleId?: number;
  categoryIds: number[];
  statuses: number[];
  typeId?: number;
}) {
  const loadMore = useCallback(
    async (offset: number) => {
      const params = new URLSearchParams();
      if (categoryIds.length) params.set('categories', categoryIds.join(','));
      if (statuses.length) params.set('statuses', statuses.join(','));
      if (typeId !== undefined) params.set('type', String(typeId));
      params.set('offset', String(offset));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/v1/items?${params.toString()}`);
      if (!res.ok) return { items: [], hasMore: false };
      const json = await res.json();
      return { items: json.data as any[], hasMore: Boolean(json.hasMore) };
    },
    [categoryIds, statuses, typeId]
  );

  const pathname = usePathname();
  const storageKey = useMemo(
    () => `${pathname}|${categoryIds.join(',')}|${statuses.join(',')}|${typeId ?? ''}`,
    [pathname, categoryIds, statuses, typeId]
  );

  const infiniteScroll = useInfiniteScroll({ storageKey, initialItems: items, initialHasMore: hasMore, loadMore });

  if (infiniteScroll.items.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)' }}>No items match these filters.</div>;
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
        {infiniteScroll.items.map((item) => (
          <div key={item.id} className="fade-in-item">
            <ItemCard
              item={item}
              settings={settings}
              showDeleteButton={showDeleteButton}
              sellMode={sellMode}
              saleId={saleId}
            />
          </div>
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
