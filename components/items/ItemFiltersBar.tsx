// components/items/ItemFiltersBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPill } from '@/components/ui/FilterPill';
import { FilterPillRow } from '@/components/ui/FilterPillRow';
import { Tooltip } from '@/components/ui/Tooltip';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { TagManagerModal } from '@/components/reference-data/TagManagerModal';
import { FilterTagPickerModal } from './FilterTagPickerModal';
import { Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type FilterOption = { id: number; name: string | null };
type ManagedResource = 'category' | 'type' | 'location';

// The synthetic "Other" bucket (see OTHER_FILTER_ID in
// app/lib/services/items.ts) has no real row and therefore no entry in
// itemCounts — showing "(0)" next to it would be actively misleading
// (there being items with no category/type is exactly why it exists), so
// it's the one pill that never gets a count suffix.
const OTHER_ID = 0;

function pillLabel(opt: FilterOption, itemCounts: Record<number, number>) {
  if (opt.id === OTHER_ID) return opt.name ?? '';
  return `${opt.name ?? ''} (${itemCounts[opt.id] ?? 0})`;
}

function ManageButton({ label, onClick }: { label: string; onClick: () => void }) {
  // Deliberately low-contrast — this used to be a solid secondary-colored
  // button, which competed for attention with both the "more" tag (also
  // secondary-colored) and the actual selected-state blue, which is what
  // should draw the eye first. An icon link reads as a secondary action
  // without visually shouting.
  return (
    <Tooltip text={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
        }}
      >
        <Cog6ToothIcon style={{ width: '16px', height: '16px' }} />
      </button>
    </Tooltip>
  );
}

const EXPANDED_STORAGE_KEY = 'itemFiltersExpanded';

export function ItemFiltersBar({
  categories,
  types,
  locations,
  categoryItemCounts,
  typeItemCounts,
  locationItemCounts,
  selectedCategoryIds,
  selectedStatuses,
  selectedTypeIds,
  selectedLocationIds,
  sellModeActive = false,
  categoryLabel,
  typeLabel,
  locationLabel,
  statusLabel,
  availableStatuses = [1, 2, 3, 4],
}: {
  categories: FilterOption[];
  types: FilterOption[];
  locations: FilterOption[];
  categoryItemCounts: Record<number, number>;
  typeItemCounts: Record<number, number>;
  locationItemCounts: Record<number, number>;
  selectedCategoryIds: number[];
  selectedStatuses: number[];
  selectedTypeIds: number[];
  selectedLocationIds: number[];
  sellModeActive?: boolean;
  categoryLabel: string;
  typeLabel: string;
  locationLabel: string;
  statusLabel?: string;
  availableStatuses?: number[];
}) {
  const t = useTranslations('items');
  const { isPending, setParam, setParams, toggleInList } = useFilterParams();
  // Which "Manage X" modal (if any) is currently open — kept local to this
  // component rather than lifted to the page, since it's fed entirely by
  // props this component already has (categories/types/locations + their
  // item counts). See TagManagerModal for the shared modal itself.
  const [openManager, setOpenManager] = useState<ManagedResource | null>(null);
  // Separate from openManager: the pill row's own "more" overflow button
  // (see FilterPillRow) opens FilterTagPickerModal instead — a plain "pick
  // which tags are active" view (same pills, same instant-toggle
  // interaction as the row itself), not the create/rename/delete tooling
  // TagManagerModal offers.
  const [openMore, setOpenMore] = useState<ManagedResource | null>(null);

  // Collapsed by default has a real cost (hides functionality from anyone
  // who hasn't touched it before), so this starts expanded and only
  // collapses once a person has actually chosen to — remembered per-browser
  // rather than reset on every page load. Read client-side after mount
  // (not during render) since localStorage isn't available during SSR.
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    const stored = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (stored !== null) setExpanded(stored === 'true');
  }, []);
  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev;
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, String(next));
      return next;
    });
  }

  // "Available only" is the unannounced default a fresh page load already
  // starts from (see app/dashboard/(protected)/items/page.tsx) — counting
  // it as an "active filter" here would make the summary claim something's
  // filtered on every single visit, which isn't useful. Only a status
  // selection that actually differs from that default counts.
  const statusIsDefault = selectedStatuses.length === 1 && selectedStatuses[0] === 1;
  const activeCount =
    selectedCategoryIds.length +
    selectedTypeIds.length +
    selectedLocationIds.length +
    (statusIsDefault || sellModeActive ? 0 : selectedStatuses.length);

  function clearAll() {
    // statuses is deliberately left alone — clearing it back to null just
    // returns to the Available-only default (see app/dashboard/(protected)/
    // items/page.tsx), which stays selected rather than being wiped too.
    setParams({ categories: null, types: null, locations: null, statuses: null });
  }

  // Deselecting the last status pill needs to mean "show every status" —
  // but the shared toggleInList removes the param entirely when the list
  // empties out, and an absent `statuses` param is what a fresh page load
  // uses to mean "Available only" (see app/dashboard/(protected)/items/
  // page.tsx). Without a distinct sentinel, unchecking the last pill would
  // silently snap back to the Available-only default instead of showing
  // everything. `all` can't collide with a real status id (those are 1-4).
  function toggleStatus(current: number[], id: number) {
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setParam('statuses', next.length ? next.join(',') : 'all');
  }

  function paramKeyFor(key: ManagedResource) {
    return key === 'category' ? 'categories' : key === 'type' ? 'types' : 'locations';
  }

  function renderPillFilterSection(
    key: ManagedResource,
    label: string,
    options: FilterOption[],
    itemCounts: Record<number, number>,
    selected: number[],
  ) {
    return (
      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{label}</span>
          <ManageButton label={t('manageLabel', { label })} onClick={() => setOpenManager(key)} />
        </div>
        <FilterPillRow
          pills={options.map((opt) => ({ id: opt.id, label: pillLabel(opt, itemCounts) }))}
          selectedIds={selected}
          onToggle={(id) => toggleInList(paramKeyFor(key), selected, id)}
          moreLabel={t('more')}
          onMore={() => setOpenMore(key)}
        />
      </div>
    );
  }

  return (
    <div className="item-filters-card">
      <div className="item-filters-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span>{t('filtersTitle')}</span>
          {activeCount > 0 && (
            <span className="item-filters-status" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
              {t('filtersActive', { count: activeCount })}
              {' · '}
              <button
                type="button"
                onClick={clearAll}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-primary)', font: 'inherit', textDecoration: 'underline' }}
              >
                {t('clearAllFilters')}
              </button>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {isPending && <span className="item-filters-status">{t('searching')}</span>}
          <Tooltip text={expanded ? t('collapseFilters') : t('expandFilters')}>
            <button
              type="button"
              onClick={toggleExpanded}
              aria-label={expanded ? t('collapseFilters') : t('expandFilters')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              {expanded ? (
                <ChevronUpIcon style={{ width: '18px', height: '18px' }} />
              ) : (
                <ChevronDownIcon style={{ width: '18px', height: '18px' }} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {expanded && (
        <>
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-section-label">{statusLabel ?? t('filterStatuses')}</span>
            </div>
            <div className="filter-pill-row">
              {availableStatuses.map((s) => (
                <FilterPill
                  key={s}
                  label={t(`status${s}`)}
                  variant="status"
                  selected={sellModeActive ? s === 1 : selectedStatuses.includes(s)}
                  disabled={sellModeActive}
                  onClick={() => !sellModeActive && toggleStatus(selectedStatuses, s)}
                />
              ))}
            </div>
          </div>

          {renderPillFilterSection('category', categoryLabel, categories, categoryItemCounts, selectedCategoryIds)}

          {renderPillFilterSection('type', typeLabel, types, typeItemCounts, selectedTypeIds)}

          {renderPillFilterSection('location', locationLabel, locations, locationItemCounts, selectedLocationIds)}
        </>
      )}

      {/* The "Other" pill (id 0, synthetic — see OTHER_FILTER_ID in
          app/lib/services/items.ts) is appended into `categories`/`types`
          purely for filtering; it isn't a real row and must never be
          offered as something to rename/delete/pick in either modal
          below. */}
      {openManager === 'category' && (
        <TagManagerModal
          mode="manage"
          apiPath="/api/v1/categories"
          label={categoryLabel}
          items={categories.filter((c) => c.id !== 0)}
          itemCounts={categoryItemCounts}
          onClose={() => setOpenManager(null)}
        />
      )}
      {openManager === 'type' && (
        <TagManagerModal
          mode="manage"
          apiPath="/api/v1/types"
          label={typeLabel}
          items={types.filter((tp) => tp.id !== 0)}
          itemCounts={typeItemCounts}
          onClose={() => setOpenManager(null)}
        />
      )}
      {openManager === 'location' && (
        <TagManagerModal
          mode="manage"
          apiPath="/api/v1/locations"
          label={locationLabel}
          items={locations.filter((loc) => loc.id !== 0)}
          itemCounts={locationItemCounts}
          onClose={() => setOpenManager(null)}
        />
      )}

      {openMore === 'category' && (
        <FilterTagPickerModal
          label={categoryLabel}
          items={categories.filter((c) => c.id !== 0)}
          itemCounts={categoryItemCounts}
          selectedIds={selectedCategoryIds}
          onApply={(ids) => setParam('categories', ids.length ? ids.join(',') : null)}
          onClose={() => setOpenMore(null)}
        />
      )}
      {openMore === 'type' && (
        <FilterTagPickerModal
          label={typeLabel}
          items={types.filter((tp) => tp.id !== 0)}
          itemCounts={typeItemCounts}
          selectedIds={selectedTypeIds}
          onApply={(ids) => setParam('types', ids.length ? ids.join(',') : null)}
          onClose={() => setOpenMore(null)}
        />
      )}
      {openMore === 'location' && (
        <FilterTagPickerModal
          label={locationLabel}
          items={locations.filter((loc) => loc.id !== 0)}
          itemCounts={locationItemCounts}
          selectedIds={selectedLocationIds}
          onApply={(ids) => setParam('locations', ids.length ? ids.join(',') : null)}
          onClose={() => setOpenMore(null)}
        />
      )}
    </div>
  );
}
