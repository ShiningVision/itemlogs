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
// On SQL injection: this box's input never reaches the database as
// anything other than a bound function parameter (see the comment on
// resolveSearchItemIds in app/lib/services/items.ts) — that's true
// regardless of what's typed here, visitor or not. The maxLength below is
// just to keep the input from growing unreasonably long before it's even
// submitted, not a security measure.
const SEARCH_INPUT_MAX_LENGTH = 100;

export function StorefrontSearchBar({ search = '' }: { search?: string }) {
  const t = useTranslations('storefront');
  const { setParam } = useFilterParams();

  const [searchInput, setSearchInput] = useState(search);
  const lastPushedSearchRef = useRef(search);
  useEffect(() => {
    if (search !== lastPushedSearchRef.current) {
      setSearchInput(search);
      lastPushedSearchRef.current = search;
    }
  }, [search]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    []
  );

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
  }

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
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
        type="text"
        className="sheet-input"
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
        maxLength={SEARCH_INPUT_MAX_LENGTH}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        style={{ paddingLeft: '36px', paddingRight: searchInput ? '36px' : undefined, width: '100%' }}
      />
      {searchInput && (
        <button
          type="button"
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
      )}
    </div>
  );
}
