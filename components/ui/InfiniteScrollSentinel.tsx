// components/ui/InfiniteScrollSentinel.tsx
'use client';

import type { RefObject } from 'react';

// Invisible marker placed at the bottom of an infinite-scroll list. Its
// IntersectionObserver (set up by useInfiniteScroll) fires when it nears the
// viewport, triggering the next batch load. Renders a small spinner while a
// fetch is in flight, and nothing once the list is exhausted.
export function InfiniteScrollSentinel({
  sentinelRef,
  hasMore,
  isLoading,
}: {
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoading: boolean;
}) {
  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-lg) 0', minHeight: '1px' }}>
      {isLoading && <span className="infinite-scroll-spinner" aria-hidden="true" />}
    </div>
  );
}
