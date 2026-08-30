// components/storefront/SelectedFiltersRow.tsx
'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';

export type SelectedFilterChip = {
  // Matches the URL param key each dimension is stored under (see
  // FilterSidebar/app/page.tsx) — passed straight to toggleInList below.
  dimension: 'categories' | 'types' | 'locations' | 'statuses';
  id: number;
  label: string;
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
  const { toggleInList, setParams } = useFilterParams();

  if (chips.length === 0) return null;

  function remove(chip: SelectedFilterChip) {
    const currentIds = chips.filter((c) => c.dimension === chip.dimension).map((c) => c.id);
    toggleInList(chip.dimension, currentIds, chip.id);
  }

  function clearAll() {
    setParams({ categories: null, types: null, locations: null, statuses: null });
  }

  return (
    <div className="storefront-selected-filters-row">
      <button type="button" className="filter-clear-button filter-clear-button--small" onClick={clearAll}>
        {t('clearAllFilters')}
      </button>
      {chips.map((chip) => (
        <button
          key={`${chip.dimension}-${chip.id}`}
          type="button"
          className="storefront-selected-filter-chip"
          aria-label={t('removeFilterChip', { label: chip.label })}
          onClick={() => remove(chip)}
        >
          <span>{chip.label}</span>
          <XMarkIcon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
