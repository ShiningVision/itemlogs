// app/lib/hooks/useFilterParams.ts
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
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

  // Mirrors the URL params, but is updated synchronously by every
  // setParam/setParams call instead of waiting for the next render.
  // Without this, two clicks fired in quick succession (e.g. tapping two
  // filter pills before the first navigation's re-render lands) both build
  // their URL from the same pre-navigation `searchParams` snapshot — the
  // second router.push then overwrites the first's change entirely, since
  // it never saw it. Basing every update on this ref instead means each
  // click composes on top of whatever the previous click just set, not on
  // stale render-time state.
  // Explicitly typed as plain URLSearchParams (a copy, via .toString()) —
  // Next's searchParams is a ReadonlyURLSearchParams, a distinct type whose
  // mutating methods (append/set/delete/sort — unused here, but part of the
  // type) are typed as taking no arguments specifically to make them
  // unusable. Assigning it straight into a URLSearchParams-typed ref (or
  // vice versa) doesn't type-check because of that signature mismatch, so
  // this always stores its own independent copy instead.
  const pendingParamsRef = useRef<URLSearchParams>(new URLSearchParams(searchParams.toString()));

  // Once real navigation catches up and nothing else is in flight, resync
  // the ref to the confirmed URL (picks up back/forward nav, links, etc.
  // that didn't go through this hook).
  useEffect(() => {
    if (!isPending) {
      pendingParamsRef.current = new URLSearchParams(searchParams.toString());
    }
  }, [searchParams, isPending]);

  function setParam(key: string, value: string | null) {
    setParams({ [key]: value });
  }

  function setParams(updates: Record<string, string | null>) {
    const finalUpdates = 'page' in updates ? updates : { ...updates, page: null };
    const url = buildUrl(pathname, pendingParamsRef.current, finalUpdates);
    pendingParamsRef.current = new URLSearchParams(url.slice(url.indexOf('?') + 1));
    startTransition(() => {
      router.push(url);
    });
  }

  /** Toggle `id` in/out of a comma-joined multi-select param (e.g. categories=1,3,5). */
  function toggleInList(key: string, current: number[], id: number) {
    // Always read the live value for this key off the pending ref, never
    // the caller's `current` array — `current` comes from props derived at
    // the last completed render, which is exactly the stale snapshot this
    // hook works around above. Since the ref is seeded from the real URL on
    // mount and kept in sync by every setParams call, it's authoritative
    // even when `.get(key)` is null — that unambiguously means "empty",
    // not "not yet known". (A version of this that fell back to `current`
    // when the ref's value was null broke specifically on a deselect that
    // emptied the list — the key is removed from the URL entirely at that
    // point, so the very next click would misread that as "unknown" and
    // resurrect the stale, pre-deselect prop value instead.)
    const pendingRaw = pendingParamsRef.current.get(key);
    const base = pendingRaw ? pendingRaw.split(',').filter(Boolean).map(Number) : [];
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    setParam(key, next.length ? next.join(',') : null);
  }

  // Read the pending-aware raw value of a param, for callers with custom
  // toggle logic that can't just use toggleInList (e.g. a param with a
  // sentinel value alongside its normal comma-list values — see
  // ItemFiltersBar's toggleStatus). Reading off the same ref toggleInList
  // uses gives them the same race-free behavior without duplicating it.
  function getParam(key: string): string | null {
    return pendingParamsRef.current.get(key);
  }

  return { searchParams, pathname, isPending, setParam, setParams, toggleInList, getParam };
}
