// components/storefront/SelectedFiltersRow.tsx
'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { FILTER_EXCLUDE_PREFIX } from '@/app/lib/idList';

export type SelectedFilterChip = {
  // Matches the URL param key each dimension is stored under (see
  // FilterSidebar/app/page.tsx) — passed straight to toggleInList below.
  dimension: 'categories' | 'types' | 'locations' | 'statuses';
  id: number;
  label: string;
  // An EXCLUDED tag (third state of the tag filters): shown struck through,
  // and removing it clears the x-prefixed exclude param instead.
  excluded?: boolean;
};

// Booking.com-style row of removable chips, one per currently active
// category/type/location/status selection — sits between the visitor page
// message and the item grid (see app/page.tsx), visitor page only. Each
// chip's `dimension` already tells us which URL param it belongs to, and
// since `chips` only ever contains the currently-selected ids (built
// server-side from the same selectedCategoryIds/etc. arrays FilterSidebar
// uses), grouping by dimension here reconstructs each dimension's full
// current id list without needing it passed down separately.
export function SelectedFiltersRow({ chips }: { chips: SelectedFilterChip[] }) {
  const t = useTranslations('storefront');
  const { toggleInList, removeFromList, setParams } = useFilterParams();

  if (chips.length === 0) return null;

  function remove(chip: SelectedFilterChip) {
    if (chip.excluded) {
      removeFromList(`${FILTER_EXCLUDE_PREFIX}${chip.dimension}`, chip.id);
      return;
    }
    const currentIds = chips.filter((c) => c.dimension === chip.dimension && !c.excluded).map((c) => c.id);
    toggleInList(chip.dimension, currentIds, chip.id);
  }

  function clearAll() {
    setParams({
      categories: null,
      types: null,
      locations: null,
      xcategories: null,
      xtypes: null,
      xlocations: null,
      statuses: null,
    });
  }

  return (
    <div className="storefront-selected-filters-row">
      <button type="button" className="filter-clear-button filter-clear-button--small" onClick={clearAll}>
        {t('clearAllFilters')}
      </button>
      {chips.map((chip) => (
        <button
          key={`${chip.excluded ? 'x' : ''}${chip.dimension}-${chip.id}`}
          type="button"
          className="storefront-selected-filter-chip"
          aria-label={t('removeFilterChip', { label: chip.label })}
          onClick={() => remove(chip)}
        >
          <span style={chip.excluded ? { textDecoration: 'line-through', color: 'var(--color-text-muted)' } : undefined}>
            {chip.label}
          </span>
          <XMarkIcon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
