// components/ui/PageJumpForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { buildPageHref } from '@/app/lib/pagination';

// Lets a person type a page number directly instead of clicking Next
// repeatedly through a long list. Client-side because it needs to react to
// keystrokes/blur — the rest of Pagination stays a plain server component
// that works with zero JS.
//
// No Go button and no "invalid page" error message: the field commits on
// blur (same pattern as the free-text settings fields in
// GeneralSettingsForm), and out-of-range or unparseable input is silently
// clamped rather than rejected — anything below 1 or unparseable becomes 1,
// anything above totalPages becomes totalPages.
export function PageJumpForm({
  page,
  totalPages,
  inputLabel,
}: {
  page: number;
  totalPages: number;
  inputLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(String(page));

  // Keep the input in sync when the page changes from elsewhere (Prev/Next
  // links, browser back/forward) — this component can persist across those
  // navigations rather than remounting, and a stale typed-in value left
  // behind would be confusing.
  useEffect(() => {
    setValue(String(page));
  }, [page]);

  function clamp(raw: string): number {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return 1;
    const n = Number(trimmed);
    if (!Number.isSafeInteger(n) || n < 1) return 1;
    if (n > totalPages) return totalPages;
    return n;
  }

  function commit() {
    const target = clamp(value);
    setValue(String(target));
    if (target === page) return;

    const paramsObj: Record<string, string | undefined> = {};
    searchParams.forEach((v, k) => {
      paramsObj[k] = v;
    });
    router.push(buildPageHref(pathname, paramsObj, target));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      // Belt-and-suspenders — the real clamping is in clamp() above, this
      // just steers mobile keyboards/browser autocomplete toward digits so
      // most invalid input never gets typed in the first place.
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={inputLabel}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      style={{
        width: '3em',
        textAlign: 'center',
        padding: 'var(--spacing-xs)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        fontSize: 'var(--font-size-sm)',
      }}
    />
  );
}
