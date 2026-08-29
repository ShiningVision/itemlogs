// components/storefront/FilterSidebar.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { FilterPill } from '@/components/ui/FilterPill';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFilterDrawer } from './FilterDrawerContext';

type Option = { id: number; name: string | null };

// Past this many options, a wrapping cloud of pills stops being scannable —
// switch to a vertical checkbox list with counts instead (Booking/Skyscanner
// style), which reads predictably at any length.
const ADAPTIVE_THRESHOLD = 8;

export function FilterSidebar({
  categories,
  types,
  locations,
  selectedCategoryIds,
  selectedTypeIds,
  selectedLocationIds,
  availableStatuses,
  selectedStatuses,
  categoryLabel,
  typeLabel,
  locationLabel,
  statusLabel,
  statusOptionLabels,
  categoryCounts = {},
  typeCounts = {},
  locationCounts = {},
  packageFilter,
  locationFilter,
}: {
  categories: Option[];
  types: Option[];
  locations?: Option[];
  selectedCategoryIds: number[];
  selectedTypeIds: number[];
  selectedLocationIds?: number[];
  availableStatuses: number[];
  selectedStatuses: number[];
  categoryLabel: string;
  typeLabel: string;
  locationLabel?: string;
  statusLabel: string;
  statusOptionLabels: Record<number, string>;
  categoryCounts?: Record<number, number>;
  typeCounts?: Record<number, number>;
  locationCounts?: Record<number, number>;
  packageFilter?: React.ReactNode;
  // Kept as a separate boolean rather than inferring from `locations` being
  // present/non-empty — mirrors how show_package_filter gates packageFilter
  // at the call site (app/page.tsx), so an owner with locations seeded but
  // the toggle off still sees no location section.
  locationFilter?: boolean;
}) {
  const t = useTranslations('storefront');
  const { toggleInList, setParams } = useFilterParams();
  const { isOpen: drawerOpen, close: closeDrawer } = useFilterDrawer();

  const activeCount =
    selectedCategoryIds.length +
    selectedTypeIds.length +
    (locationFilter ? (selectedLocationIds ?? []).length : 0) +
    selectedStatuses.length;

  function clearAll() {
    setParams({ categories: null, types: null, locations: null, statuses: null });
  }

  // Category and type lists can get long, so their sections collapse —
  // status stays a small fixed set of pills and doesn't need this. Open by
  // default so the filters are still discoverable at a glance.
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [typesOpen, setTypesOpen] = useState(true);
  const [locationsOpen, setLocationsOpen] = useState(true);

  // onToggle omitted (status filter) → plain static label, always expanded;
  // category/type pass a real toggle and get the collapsible chevron header.
  // onClear is separate from onToggle and rendered as a sibling, not nested
  // inside the toggle button — the toggle is itself a <button> (for the
  // chevron), and a clear button nested inside it would both be invalid
  // HTML (button-in-button) and fire both handlers on one click.
  const sectionHeader = (title: string, open: boolean, onToggle?: () => void, onClear?: () => void) => {
    const label = !onToggle ? (
      <div className="storefront-filter-section-label">{title}</div>
    ) : (
      <button
        type="button"
        className="storefront-filter-section-label storefront-filter-section-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDownIcon
          aria-hidden="true"
          style={{
            width: '16px',
            height: '16px',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--motion-duration, 150ms) var(--motion-easing, ease)',
          }}
        />
      </button>
    );

    if (!onClear) return label;

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)' }}>
        {label}
        <button type="button" className="filter-clear-button filter-clear-button--small" onClick={onClear}>
          {t('clearFilter')}
        </button>
      </div>
    );
  };

  const pillSection = (
    title: string,
    options: { id: number; label: string }[],
    selected: number[],
    key: string,
    open: boolean = true,
    onToggle?: () => void,
    onClear?: () => void
  ) => (
    <div className="storefront-filter-section">
      {sectionHeader(title, open, onToggle, selected.length > 0 ? onClear : undefined)}
      {open && (
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
      )}
    </div>
  );

  const checkboxSection = (
    title: string,
    options: { id: number; label: string }[],
    selected: number[],
    key: string,
    counts: Record<number, number>,
    open: boolean,
    onToggle: () => void,
    onClear?: () => void
  ) => (
    <div className="storefront-filter-section">
      {sectionHeader(title, open, onToggle, selected.length > 0 ? onClear : undefined)}
      {open && (
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
      )}
    </div>
  );

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.name ?? '' }));
  const typeOptions = types.map((t2) => ({ id: t2.id, label: t2.name ?? '' }));
  const locationOptions = (locations ?? []).map((l) => ({ id: l.id, label: l.name ?? '' }));

  const content = (
    <>
      {activeCount > 0 && (
        <div className="storefront-filter-section" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="filter-clear-button" onClick={clearAll}>
            {t('clearAllFilters')}
          </button>
        </div>
      )}

      {packageFilter && (
        <div className="storefront-package-filter-drawer-only storefront-filter-section">
          {packageFilter}
        </div>
      )}

      {categoryOptions.length > ADAPTIVE_THRESHOLD
        ? checkboxSection(categoryLabel, categoryOptions, selectedCategoryIds, 'categories', categoryCounts, categoriesOpen, () => setCategoriesOpen((v) => !v), () => setParams({ categories: null }))
        : pillSection(categoryLabel, categoryOptions, selectedCategoryIds, 'categories', categoriesOpen, () => setCategoriesOpen((v) => !v), () => setParams({ categories: null }))}

      {typeOptions.length > ADAPTIVE_THRESHOLD
        ? checkboxSection(typeLabel, typeOptions, selectedTypeIds, 'types', typeCounts, typesOpen, () => setTypesOpen((v) => !v), () => setParams({ types: null }))
        : pillSection(typeLabel, typeOptions, selectedTypeIds, 'types', typesOpen, () => setTypesOpen((v) => !v), () => setParams({ types: null }))}

      {locationFilter && locationOptions.length > 0 &&
        (locationOptions.length > ADAPTIVE_THRESHOLD
          ? checkboxSection(locationLabel ?? '', locationOptions, selectedLocationIds ?? [], 'locations', locationCounts, locationsOpen, () => setLocationsOpen((v) => !v), () => setParams({ locations: null }))
          : pillSection(locationLabel ?? '', locationOptions, selectedLocationIds ?? [], 'locations', locationsOpen, () => setLocationsOpen((v) => !v), () => setParams({ locations: null })))}

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
