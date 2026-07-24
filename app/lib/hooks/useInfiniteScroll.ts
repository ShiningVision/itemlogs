// app/lib/hooks/useInfiniteScroll.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Generic infinite-scroll state manager. Works for two shapes of data source:
//  - "server-fetch": loadMore actually hits an API route for the next batch
//    (used where the list is DB-paginated, e.g. items with filters).
//  - "client-slice": the full array is already in memory (cheap lists like
//    packages/sales that fetch everything up front) and loadMore just
//    resolves a local slice — no network call at all.
// Either way the calling component only deals with a flat `items` array, a
// `hasMore` flag, and a `sentinelRef` to place at the bottom of the list.
export function useInfiniteScroll<T>({
  storageKey,
  initialItems,
  initialHasMore,
  loadMore,
}: {
  // Identifies this particular list + filter combination (e.g. pathname plus
  // the active category/status filters) so scroll position can be saved and
  // restored per-view. Omit to opt out of restoration entirely.
  storageKey?: string;
  initialItems: T[];
  initialHasMore: boolean;
  loadMore: (offset: number) => Promise<{ items: T[]; hasMore: boolean }>;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const offsetRef = useRef(initialItems.length);
  const hasMoreRef = useRef(initialHasMore);
  const loadingRef = useRef(false);
  const restoringRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // The parent server component re-renders with a fresh `initialItems` array
  // whenever filters/sort/search params change — reset local state to match
  // instead of continuing to append onto the previous filter's results.
  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    offsetRef.current = initialItems.length;
    hasMoreRef.current = initialHasMore;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, initialHasMore]);

  // Returns true if it actually fetched (and appended) another batch, false
  // if there was nothing left to load (or a fetch was already in flight).
  // Uses refs rather than the `hasMore`/`isLoading` state so the scroll-
  // restoration loop below can await consecutive calls without waiting on
  // React's render cycle in between.
  const fetchNext = useCallback(async (): Promise<boolean> => {
    if (loadingRef.current || !hasMoreRef.current) return false;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const { items: nextItems, hasMore: nextHasMore } = await loadMore(offsetRef.current);
      offsetRef.current += nextItems.length;
      hasMoreRef.current = nextHasMore && nextItems.length > 0;
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(hasMoreRef.current);
      return nextItems.length > 0;
    } catch (error) {
      console.error('Failed to load more items:', error);
      // Stop trying to auto-load on error rather than hammering a failing endpoint.
      hasMoreRef.current = false;
      setHasMore(false);
      return false;
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore]);

  // Coming "back" from an item's detail page re-renders this list from
  // scratch, server-side, with only the first batch — there's nowhere near
  // enough content for the browser to scroll to where you actually were.
  // So: on mount, check sessionStorage for how many items were loaded and
  // how far down the page was scrolled before we navigated away, fetch
  // batches until we've caught back up, then jump to that scroll position.
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    let cancelled = false;

    // Next.js's own router also tries to control scroll position on
    // navigation (usually resetting to the top), which can silently
    // overwrite our restored position if it runs after we do. Take manual
    // control of scroll restoration for the life of this component so
    // nothing else fights with it.
    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    async function restore() {
      const raw = sessionStorage.getItem(`infiniteScroll:${storageKey}`);
      if (!raw) return;

      let saved: { count: number; scrollY: number };
      try {
        saved = JSON.parse(raw);
      } catch {
        return;
      }

      restoringRef.current = true;
      while (!cancelled && offsetRef.current < saved.count && hasMoreRef.current) {
        const fetched = await fetchNext();
        if (!fetched) break;
      }
      restoringRef.current = false;

      if (cancelled) return;

      // Reassert the scroll position a few times over the next second.
      // Next.js's navigation scroll handling, Suspense boundaries settling,
      // or images loading in and changing document height can all still
      // shift scroll position shortly after we set it once — repeating the
      // scrollTo wins that race instead of losing it silently.
      const delays = [0, 50, 150, 300, 600, 1000];
      for (const delay of delays) {
        setTimeout(() => {
          if (!cancelled) window.scrollTo(0, saved.scrollY);
        }, delay);
      }
    }

    restore();
    return () => {
      cancelled = true;
      history.scrollRestoration = previousScrollRestoration;
    };
    // Only run once on mount for a given storageKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Continuously remember how many items are loaded and how far down the
  // page we are, so the effect above can restore it after navigating back.
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;

    function save() {
      sessionStorage.setItem(
        `infiniteScroll:${storageKey}`,
        JSON.stringify({ count: items.length, scrollY: window.scrollY })
      );
    }

    save();
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('scroll', save);
      window.removeEventListener('pagehide', save);
    };
  }, [storageKey, items.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Don't let the sentinel's own IntersectionObserver kick off a
        // regular load while the restore-on-mount catch-up loop is running.
        if (entries[0]?.isIntersecting && !restoringRef.current) fetchNext();
      },
      { rootMargin: '600px' } // start loading well before the sentinel is actually visible
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNext]);

  return { items, hasMore, isLoading, sentinelRef };
}
