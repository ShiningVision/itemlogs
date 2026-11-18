// app/lib/idList.ts
//
// Parses a comma-joined id list URL param ("1,3,5") into numbers. Used for
// both the include params (categories/types/locations) and their exclude
// counterparts (xcategories/xtypes/xlocations) — see FILTER_EXCLUDE_PREFIX.
export function parseIdList(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0);
}

// The tag filters (category/type/location) are three-state: click once to
// include a tag, again to EXCLUDE it, again to clear it. Included ids live in
// `categories=1,3`, excluded ids in `xcategories=2` (same name, prefixed).
export const FILTER_EXCLUDE_PREFIX = 'x';
