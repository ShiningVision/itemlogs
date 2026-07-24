// components/storefront/FilterSidebar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { FilterPill } from '@/components/ui/FilterPill';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFilterDrawer } from './FilterDrawerContext';

type Option = { id: number; name: string | null };

// Past this many options, a wrapping cloud of pills stops being scannable —
// switch to a vertical checkbox list with counts instead (Booking/Skyscanner
// style), which reads predictably at any length.
const ADAPTIVE_THRESHOLD = 8;

export function FilterSidebar({
  categories,
  types,
  selectedCategoryIds,
  selectedTypeIds,
  availableStatuses,
  selectedStatuses,
  categoryLabel,
  typeLabel,
  statusLabel,
  statusOptionLabels,
  categoryCounts = {},
  typeCounts = {},
  packageFilter,
}: {
  categories: Option[];
  types: Option[];
  selectedCategoryIds: number[];
  selectedTypeIds: number[];
  availableStatuses: number[];
  selectedStatuses: number[];
  categoryLabel: string;
  typeLabel: string;
  statusLabel: string;
  statusOptionLabels: Record<number, string>;
  categoryCounts?: Record<number, number>;
  typeCounts?: Record<number, number>;
  packageFilter?: React.ReactNode;
}) {
  const t = useTranslations('storefront');
  const { toggleInList } = useFilterParams();
  const { isOpen: drawerOpen, close: closeDrawer } = useFilterDrawer();

  const pillSection = (title: string, options: { id: number; label: string }[], selected: number[], key: string) => (
    <div className="storefront-filter-section">
      <div className="storefront-filter-section-label">{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        {options.map((opt) => (
          <FilterPill
            key={opt.id}
            label={opt.label}
            selected={selected.includes(opt.id)}
            onClick={() => toggleInList(key, selected, opt.id)}
          />
        ))}
      </div>
    </div>
  );

  const checkboxSection = (
    title: string,
    options: { id: number; label: string }[],
    selected: number[],
    key: string,
    counts: Record<number, number>
  ) => (
    <div className="storefront-filter-section">
      <div className="storefront-filter-section-label">{title}</div>
      <div className="storefront-filter-checkbox-list">
        {options.map((opt) => (
          <label key={opt.id} className="storefront-filter-checkbox-row">
            <span className="storefront-filter-checkbox-label">
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggleInList(key, selected, opt.id)}
              />
              {opt.label}
            </span>
            <span className="storefront-filter-count">{counts[opt.id] ?? 0}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name ?? '' }));
  const typeOptions = types.map((t2) => ({ id: t2.id, label: t2.name ?? '' }));

  const content = (
    <>
      {packageFilter && (
        <div className="storefront-package-filter-drawer-only storefront-filter-section">
          {packageFilter}
        </div>
      )}

      {categoryOptions.length > ADAPTIVE_THRESHOLD
        ? checkboxSection(categoryLabel, categoryOptions, selectedCategoryIds, 'categories', categoryCounts)
        : pillSection(categoryLabel, categoryOptions, selectedCategoryIds, 'categories')}

      {typeOptions.length > ADAPTIVE_THRESHOLD
        ? checkboxSection(typeLabel, typeOptions, selectedTypeIds, 'types', typeCounts)
        : pillSection(typeLabel, typeOptions, selectedTypeIds, 'types')}

      {/* Status filter is omitted entirely when there's only one (or zero) selectable status — ticking a single option is meaningless */}
      {availableStatuses.length > 1 &&
        pillSection(
          statusLabel,
          availableStatuses.map((s) => ({ id: s, label: statusOptionLabels[s] })),
          selectedStatuses,
          'statuses'
        )}
    </>
  );

  return (
    <>
      <aside className="storefront-filter-sidebar">{content}</aside>

      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeDrawer}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        >
          <div className="storefront-filter-drawer-panel storefront-filter-drawer-panel--open" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('filters')}</span>
              <button
                type="button"
                aria-label={t('closeFilters')}
                onClick={closeDrawer}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
