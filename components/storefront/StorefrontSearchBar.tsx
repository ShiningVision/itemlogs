// components/storefront/StorefrontSearchBar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Public-facing counterpart to the dashboard items page's search box (see
// ItemFiltersBar) — same fuzzy, typo-tolerant name search
// (search_items_by_name, see app/lib/services/items.ts), same debounced
// local-input/URL-param split, and the same echo-guard against the
// slow-typing character-drop bug (see lastPushedSearchRef below). Kept as
// its own component rather than reused directly since the dashboard one
// also owns the category/type/location filter bar and its manage modals,
// none of which apply here.
//
// On mobile (rendered in the header next to the filter icon) this starts
// collapsed to just the magnifying-glass icon — a permanently open search
// field was too prominent for a page a visitor is mostly just browsing.
// Clicking it opens a compact input; it collapses back once blurred empty,
// or after clearing. On desktop (rendered as its own row above the filter
// sidebar, via the alwaysExpanded prop) there's room for the field itself,
// so it skips the icon-only state entirely.
//
// On SQL injection: this box's input never reaches the database as
// anything other than a bound function parameter (see the comment on
// resolveSearchItemIds in app/lib/services/items.ts) — that's true
// regardless of what's typed here, visitor or not. The maxLength below is
// just to keep the input from growing unreasonably long before it's even
// submitted, not a security measure.
const SEARCH_INPUT_MAX_LENGTH = 100;

export function StorefrontSearchBar({
  search = '',
  alwaysExpanded = false,
}: {
  search?: string;
  alwaysExpanded?: boolean;
}) {
  const t = useTranslations('storefront');
  const { setParam } = useFilterParams();

  // Starts open if a search is already active (e.g. a bookmarked/shared
  // URL with ?search=...) so the visitor can see and edit what's already
  // filtering the grid, rather than it being invisibly applied behind a
  // collapsed icon.
  const [expanded, setExpanded] = useState(alwaysExpanded || Boolean(search));
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState(search);
  const lastPushedSearchRef = useRef(search);
  useEffect(() => {
    if (search !== lastPushedSearchRef.current) {
      setSearchInput(search);
      lastPushedSearchRef.current = search;
      if (search) setExpanded(true);
    }
  }, [search]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    []
  );

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      lastPushedSearchRef.current = value;
      setParam('search', value.trim() ? value : null);
    }, 300);
  }

  function clearSearch() {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput('');
    lastPushedSearchRef.current = '';
    setParam('search', null);
    setExpanded(false);
  }

  // Collapses back to just the icon once the field loses focus with
  // nothing typed in it — an empty, opened-then-abandoned search box
  // shouldn't linger and take up space. A search that's actually been
  // typed stays open (its own X clears + collapses it instead).
  function handleBlur() {
    if (!alwaysExpanded && !searchInput.trim()) setExpanded(false);
  }

  if (!alwaysExpanded && !expanded) {
    return (
      <button
        type="button"
        className="storefront-search-toggle"
        onClick={() => setExpanded(true)}
        aria-label={t('searchPlaceholder')}
      >
        <MagnifyingGlassIcon style={{ width: '22px', height: '22px' }} />
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', width: alwaysExpanded ? '100%' : undefined, maxWidth: alwaysExpanded ? undefined : '280px' }}>
      <MagnifyingGlassIcon
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'var(--spacing-sm)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        type="text"
        className="sheet-input"
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
        onBlur={handleBlur}
        maxLength={SEARCH_INPUT_MAX_LENGTH}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        style={{ paddingLeft: '36px', paddingRight: '36px', width: '100%' }}
      />
      <button
        type="button"
        // Clicking this shouldn't blur the input first (that would collapse
        // an empty box out from under the click before onClick even fires)
        // — preventDefault on mousedown keeps focus put until the click
        // itself runs clearSearch.
        onMouseDown={(e) => e.preventDefault()}
        onClick={clearSearch}
        aria-label={t('clearSearch')}
        style={{
          position: 'absolute',
          right: 'var(--spacing-sm)',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        <XMarkIcon style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
}
