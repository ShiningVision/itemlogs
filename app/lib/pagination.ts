// app/lib/pagination.ts
// Shared helpers for server-rendered, URL-driven pagination. Kept
// deliberately framework-light: a `page` search param, a page size chosen
// per list based on how heavy each item is, and a plain link-building
// helper so pages don't need client JS just to paginate.

export function parsePage(pageParam: string | undefined): number {
  const n = pageParam ? parseInt(pageParam, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

/** Paginate an already-fetched in-memory array (for small/cheap lists where
 * fetching everything and slicing is simpler than a DB-level range query). */
export function paginateArray<T>(items: T[], page: number, pageSize: number): { pageItems: T[]; totalCount: number } {
  const offset = getOffset(page, pageSize);
  return { pageItems: items.slice(offset, offset + pageSize), totalCount: items.length };
}

/** Build an href for a given page, preserving every other current search
 * param. Used server-side, where searchParams arrives as a plain object
 * rather than a URLSearchParams/useSearchParams instance. */
export function buildPageHref(
  pathname: string,
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && key !== 'page') {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
