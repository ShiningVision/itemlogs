// components/items/ItemFiltersBar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPill } from '@/components/ui/FilterPill';
import { FilterPillRow } from '@/components/ui/FilterPillRow';
import { Tooltip } from '@/components/ui/Tooltip';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { ManageFiltersModal, type ManagedResourceConfig } from '@/components/reference-data/ManageFiltersModal';
import { FilterTagPickerModal } from './FilterTagPickerModal';
import { Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

type FilterOption = { id: number; name: string | null };
type ManagedResource = 'category' | 'type' | 'location';

// The synthetic "Other" bucket (see OTHER_FILTER_ID in
// app/lib/services/items.ts).
const OTHER_ID = 0;

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
  search = '',
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
  search?: string;
}) {
  const t = useTranslations('items');
  const { isPending, setParam, setParams, toggleInList, getParam } = useFilterParams();

  // Fuzzy name search — debounced so typing doesn't fire a navigation (and
  // a full server re-render) on every keystroke. Local state mirrors the
  // input immediately for a responsive feel; the URL param (and therefore
  // the actual search) only updates once typing pauses.
  //
  // The `search` prop resyncs local state on genuine external changes
  // (browser back/forward, a bookmarked URL) — but it also comes back down
  // as an "echo" once *our own* debounced update's navigation completes.
  // Typing slowly enough that each letter's debounce fires and completes
  // before the next keystroke used to lose characters: type "P", its
  // navigation completes and the prop echoes "P" back, the resync effect
  // fires and calls setSearchInput("P") — landing right after you've
  // already typed "o" locally (searchInput === "Po"), clobbering it back
  // to "P". lastPushedRef tracks the last value *this component* pushed,
  // so the effect can tell "echo of what we just sent" (skip — local state
  // may already be ahead of it) apart from "someone else changed the URL"
  // (do resync).
  const [searchInput, setSearchInput] = useState(search);
  const lastPushedSearchRef = useRef(search);
  useEffect(() => {
    if (search !== lastPushedSearchRef.current) {
      setSearchInput(search);
      lastPushedSearchRef.current = search;
    }
  }, [search]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);
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
  // Whether the shared Manage Filters modal is open, and which resource's
  // tab it should open on — kept local to this component rather than
  // lifted to the page, since it's fed entirely by props this component
  // already has (categories/types/locations + their item counts). Each
  // section's own cog button sets this to its own resource, but the modal
  // itself (see ManageFiltersModal) has tabs for all three, so someone can
  // switch resources without closing and reopening it.
  const [openManager, setOpenManager] = useState<ManagedResource | null>(null);
  // Separate from openManager: the pill row's own "more" overflow button
  // (see FilterPillRow) opens FilterTagPickerModal instead — a plain "pick
  // which tags are active" view (same pills, same instant-toggle
  // interaction as the row itself), not the create/rename/delete tooling
  // ManageFiltersModal offers.
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
  //
  // Reads the raw pending param via getParam rather than trusting the
  // `selectedStatuses` prop, for the same reason toggleInList reads off its
  // own pending ref instead of a caller-supplied array: that prop is only
  // as fresh as the last completed render, so two status pills clicked in
  // quick succession — especially when one empties the list down to the
  // `all` sentinel — would both compute their next value from the same
  // stale snapshot and the second click would silently undo the first.
  function toggleStatus(id: number) {
    const raw = getParam('statuses');
    const current = raw === null ? [1] : raw === 'all' ? [] : raw.split(',').filter(Boolean).map(Number);
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
    selected: number[],
  ) {
    return (
      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{label}</span>
          <ManageButton label={t('manageLabel', { label })} onClick={() => setOpenManager(key)} />
        </div>
        <FilterPillRow
          pills={options.map((opt) => ({ id: opt.id, label: opt.name ?? '' }))}
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
            <span className="item-filters-status" style={{ textTransform: 'none', letterSpacing: 'normal', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {t('filtersActive', { count: activeCount })}
              <button type="button" className="filter-clear-button filter-clear-button--small" onClick={clearAll}>
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

      <div style={{ position: 'relative', margin: '0 0 var(--spacing-sm)' }}>
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
              padding: 0,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <XMarkIcon style={{ width: '16px', height: '16px' }} />
          </button>
        )}
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
                  onClick={() => !sellModeActive && toggleStatus(s)}
                />
              ))}
            </div>
          </div>

          {renderPillFilterSection('category', categoryLabel, categories, selectedCategoryIds)}

          {renderPillFilterSection('type', typeLabel, types, selectedTypeIds)}

          {renderPillFilterSection('location', locationLabel, locations, selectedLocationIds)}
        </>
      )}

      {/* The "Other" pill (id 0, synthetic — see OTHER_FILTER_ID in
          app/lib/services/items.ts) is appended into `categories`/`types`
          purely for filtering; it isn't a real row and must never be
          offered as something to rename/delete/pick in either modal
          below. */}
      {openManager && (
        <ManageFiltersModal
          resources={[
            { key: 'category', apiPath: '/api/v1/categories', label: categoryLabel, items: categories.filter((c) => c.id !== 0), itemCounts: categoryItemCounts },
            { key: 'type', apiPath: '/api/v1/types', label: typeLabel, items: types.filter((tp) => tp.id !== 0), itemCounts: typeItemCounts },
            { key: 'location', apiPath: '/api/v1/locations', label: locationLabel, items: locations.filter((loc) => loc.id !== 0), itemCounts: locationItemCounts },
          ]}
          initialResource={openManager}
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
