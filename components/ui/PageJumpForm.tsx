// components/ui/PageJumpForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { buildPageHref } from '@/app/lib/pagination';

// Lets a person type a page number directly instead of clicking Next
// repeatedly through a long list. Client-side because it needs to react to
// keystrokes/submit — the rest of Pagination stays a plain server component
// that works with zero JS.
//
// Input validation is deliberately strict: only a bare, unsigned integer
// string (`^\d+$`) is accepted before it's even converted to a number —
// decimals, signs, whitespace, exponents ("1e10"), and non-ASCII digit
// characters are all rejected outright rather than relying on parseInt's
// lenient partial-parse behavior (which would silently accept "3abc" as 3).
// The resulting number is then range-checked against both
// Number.isSafeInteger (guards against a huge digit string like a 300-digit
// number coercing to Infinity) and the actual [1, totalPages] bounds before
// it's ever used to build a URL.
export function PageJumpForm({
  page,
  totalPages,
  goLabel,
  inputLabel,
  invalidMessage,
}: {
  page: number;
  totalPages: number;
  goLabel: string;
  inputLabel: string;
  invalidMessage: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(String(page));
  const [invalid, setInvalid] = useState(false);

  // Keep the input in sync when the page changes from elsewhere (Prev/Next
  // links, browser back/forward) — this component can persist across those
  // navigations rather than remounting, and a stale typed-in value left
  // behind would be confusing.
  useEffect(() => {
    setValue(String(page));
    setInvalid(false);
  }, [page]);

  function parseTarget(raw: string): number | null {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    if (!Number.isSafeInteger(n) || n < 1 || n > totalPages) return null;
    return n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseTarget(value);
    if (target === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (target === page) return;

    const paramsObj: Record<string, string | undefined> = {};
    searchParams.forEach((v, k) => {
      paramsObj[k] = v;
    });
    router.push(buildPageHref(pathname, paramsObj, target));
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
    >
      <input
        type="text"
        inputMode="numeric"
        // Belt-and-suspenders — the real validation is parseTarget() above,
        // this just steers mobile keyboards/browser autocomplete toward
        // digits so most invalid input never gets typed in the first place.
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={inputLabel}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
        style={{
          width: '3.5em',
          textAlign: 'center',
          padding: 'var(--spacing-xs)',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${invalid ? 'var(--color-danger)' : 'var(--color-border)'}`,
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          fontSize: 'var(--font-size-sm)',
        }}
      />
      <button
        type="submit"
        style={{
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-bold)',
          cursor: 'pointer',
        }}
      >
        {goLabel}
      </button>
      {/* Absolutely positioned below the form so its appearance/disappearance
          never nudges the Prev/Next buttons sitting next to it — same
          pattern as the settings page's autosave status badge
          (.settings-row-status in globals.css). Doubles as the aria-live
          announcement for screen readers; there's no separate sr-only copy. */}
      <span
        role="alert"
        aria-live="polite"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 'var(--spacing-xs)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-danger)',
          whiteSpace: 'nowrap',
        }}
      >
        {invalid ? invalidMessage : ''}
      </span>
    </form>
  );
}
