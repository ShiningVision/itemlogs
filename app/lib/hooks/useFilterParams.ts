// app/lib/hooks/useFilterParams.ts
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { buildUrl } from '@/app/lib/url';

/**
 * Shared logic for filter UIs that drive their state through the URL's
 * search params (checkboxes, pills, dropdowns, etc). Centralizes the
 * "read current params, patch one key, push the new URL" pattern that was
 * previously duplicated across ItemFiltersBar, FilterSidebar, and
 * HeaderFilterDropdown.
 *
 * Navigation is wrapped in a transition so callers can show a pending
 * indicator (e.g. a "Searching..." pill) while the server re-renders.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Any filter change invalidates the current page of results, so unless the
  // caller is explicitly setting `page` itself (i.e. Pagination links),
  // reset back to page 1 whenever a filter changes.
  function setParam(key: string, value: string | null) {
    const updates: Record<string, string | null> = { [key]: value };
    if (key !== 'page') updates.page = null;
    const url = buildUrl(pathname, searchParams, updates);
    startTransition(() => {
      router.push(url);
    });
  }

  function setParams(updates: Record<string, string | null>) {
    const finalUpdates = 'page' in updates ? updates : { ...updates, page: null };
    const url = buildUrl(pathname, searchParams, finalUpdates);
    startTransition(() => {
      router.push(url);
    });
  }

  /** Toggle `id` in/out of a comma-joined multi-select param (e.g. categories=1,3,5). */
  function toggleInList(key: string, current: number[], id: number) {
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setParam(key, next.length ? next.join(',') : null);
  }

  return { searchParams, pathname, isPending, setParam, setParams, toggleInList };
}
