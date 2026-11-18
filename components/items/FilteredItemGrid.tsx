// components/items/FilteredItemGrid.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ItemGrid } from './ItemGrid';
import { FilterPill } from '@/components/ui/FilterPill';
import { FilterPillRow } from '@/components/ui/FilterPillRow';
import { FilterTagPickerModal } from './FilterTagPickerModal';
import { resolveLabel } from '@/app/lib/labels';
import { typesEnabled } from '@/app/lib/typesEnabled';
import type { Settings } from '@/app/lib/definitions';

type Tag = { id: number; name: string | null };
type Dimension = 'categories' | 'types' | 'locations';

// 0 is the synthetic "Other" bucket everywhere in the app's filters: an item
// with no categories/types, or no location.
const OTHER_ID = 0;

type TagFilter = { included: number[]; excluded: number[] };
const EMPTY_FILTER: TagFilter = { included: [], excluded: [] };

function itemTagIds(item: any, dimension: Dimension): number[] {
  if (dimension === 'locations') return [item.location_id ?? OTHER_ID];
  const tags: Tag[] = (dimension === 'categories' ? item.categories : item.types) ?? [];
  return tags.length > 0 ? tags.map((tag) => tag.id) : [OTHER_ID];
}

function matchesTagFilter(item: any, dimension: Dimension, filter: TagFilter): boolean {
  if (filter.included.length === 0 && filter.excluded.length === 0) return true;
  const ids = itemTagIds(item, dimension);
  if (filter.included.length > 0 && !ids.some((id) => filter.included.includes(id))) return false;
  // Exclusion wins over inclusion, same as the Items page filters.
  if (ids.some((id) => filter.excluded.includes(id))) return false;
  return true;
}

// Include -> exclude -> off, the same three-state cycle as the Items page's
// tag filters (see useFilterParams.cycleTriState) — here on local state.
function cycle(filter: TagFilter, id: number): TagFilter {
  if (filter.included.includes(id)) {
    return { included: filter.included.filter((x) => x !== id), excluded: [...filter.excluded, id] };
  }
  if (filter.excluded.includes(id)) {
    return { included: filter.included, excluded: filter.excluded.filter((x) => x !== id) };
  }
  return { included: [...filter.included, id], excluded: filter.excluded };
}

// An item grid with its own filter bar, for lists that are already fully
// loaded on the page — a package's items and a sale's items. Filtering is
// instant and purely client-side (nothing in the URL, nothing refetched),
// and the tag options are built from the tags the listed items actually
// have, so there are no dead pills. Search matches the name, description
// and tag names (a simple case-insensitive match here, not the Items page's
// typo-tolerant database search — these lists are small).
export function FilteredItemGrid({
  items,
  settings,
  onFilteredIdsChange,
  ...gridProps
}: {
  items: any[];
  settings: Settings;
  // Reports which item ids the list is currently narrowed to, or null while
  // no filter is active — lets the page's export button export exactly what
  // is showing.
  onFilteredIdsChange?: (ids: number[] | null) => void;
} & Omit<React.ComponentProps<typeof ItemGrid>, 'items' | 'settings'>) {
  const t = useTranslations('items');
  const showTypes = typesEnabled(settings);

  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<number[]>([]);
  const [filters, setFilters] = useState<Record<Dimension, TagFilter>>({
    categories: EMPTY_FILTER,
    types: EMPTY_FILTER,
    locations: EMPTY_FILTER,
  });
  const [openMore, setOpenMore] = useState<Dimension | null>(null);
  // Collapsed by default — the bar only takes room when asked for.
  const [expanded, setExpanded] = useState(false);

  const otherLabel = t('other');

  // Options + usage counts, from the items themselves.
  const options = useMemo(() => {
    function build(dimension: Dimension) {
      const counts: Record<number, number> = {};
      const names = new Map<number, string>();
      for (const item of items) {
        const ids = itemTagIds(item, dimension);
        const tags: Tag[] =
          dimension === 'locations'
            ? item.location_id != null && item.location_ref?.name
              ? [{ id: item.location_id, name: item.location_ref.name }]
              : []
            : (dimension === 'categories' ? item.categories : item.types) ?? [];
        for (const tag of tags) names.set(tag.id, tag.name ?? '');
        for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
      }
      const list: Tag[] = [...names.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || (a.name ?? '').localeCompare(b.name ?? ''));
      if ((counts[OTHER_ID] ?? 0) > 0) list.push({ id: OTHER_ID, name: otherLabel });
      return { list, counts };
    }
    return { categories: build('categories'), types: build('types'), locations: build('locations') };
  }, [items, otherLabel]);

  const presentStatuses = useMemo(
    () => [1, 2, 3, 4, 5].filter((s) => items.some((item) => item.status === s)),
    [items]
  );
  const status5Label = resolveLabel(settings.name_status, t('status5'));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (query) {
        const haystack = [
          item.name,
          item.description,
          ...(item.categories ?? []).map((c: Tag) => c.name),
          ...(showTypes ? (item.types ?? []).map((tp: Tag) => tp.name) : []),
          item.location_ref?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (statuses.length > 0 && !statuses.includes(item.status)) return false;
      if (!matchesTagFilter(item, 'categories', filters.categories)) return false;
      if (showTypes && !matchesTagFilter(item, 'types', filters.types)) return false;
      if (!matchesTagFilter(item, 'locations', filters.locations)) return false;
      return true;
    });
  }, [items, search, statuses, filters, showTypes]);

  const activeCount =
    statuses.length +
    (Object.keys(filters) as Dimension[])
      .filter((d) => d !== 'types' || showTypes)
      .reduce((sum, d) => sum + filters[d].included.length + filters[d].excluded.length, 0) +
    (search.trim() ? 1 : 0);

  function clearAll() {
    setSearch('');
    setStatuses([]);
    setFilters({ categories: EMPTY_FILTER, types: EMPTY_FILTER, locations: EMPTY_FILTER });
  }

  const reportRef = useRef(onFilteredIdsChange);
  reportRef.current = onFilteredIdsChange;
  const filteredIdsKey = filtered.map((item) => item.id).join(',');
  useEffect(() => {
    reportRef.current?.(items.length >= 2 && activeCount > 0 ? filteredIdsKey.split(',').filter(Boolean).map(Number) : null);
  }, [filteredIdsKey, activeCount, items.length]);
  // Back to "everything" if the list goes away (e.g. navigating off the page).
  useEffect(() => () => reportRef.current?.(null), []);

  // Nothing to filter with zero or one item.
  if (items.length < 2) {
    return <ItemGrid items={items} settings={settings} {...gridProps} />;
  }

  const labels: Record<Dimension, string> = {
    categories: resolveLabel(settings.name_category, t('category')),
    types: resolveLabel(settings.name_type, t('type')),
    locations: resolveLabel(settings.name_location, t('location')),
  };

  function renderSection(dimension: Dimension) {
    const { list } = options[dimension];
    // A one-option row can't narrow anything down.
    if (list.length < 2) return null;
    return (
      <div className="filter-section" key={dimension}>
        <div className="filter-section-header">
          <span className="filter-section-label">{labels[dimension]}</span>
        </div>
        <FilterPillRow
          pills={list.map((tag) => ({ id: tag.id, label: tag.name ?? '' }))}
          selectedIds={filters[dimension].included}
          excludedIds={filters[dimension].excluded}
          onToggle={(id) => setFilters((prev) => ({ ...prev, [dimension]: cycle(prev[dimension], id) }))}
          moreLabel={t('more')}
          onMore={() => setOpenMore(dimension)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="item-filters-card" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? t('collapseFilters') : t('expandFilters')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', fontWeight: 600 }}
          >
            <ChevronDownIcon style={{ width: '16px', height: '16px', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
            {t('filtersTitle')}
          </button>
          {activeCount > 0 && (
            <>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                {t('filteredCount', { shown: filtered.length, total: items.length })}
              </span>
              <button type="button" className="filter-clear-button filter-clear-button--small" onClick={clearAll}>
                {t('clearAllFilters')}
              </button>
            </>
          )}
        </div>

        {expanded && (
        <div style={{ marginTop: 'var(--spacing-sm)' }}>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            style={{ paddingLeft: '36px', paddingRight: search ? '36px' : undefined, width: '100%' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
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

        {presentStatuses.length > 1 && (
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-section-label">{t('filterStatuses')}</span>
            </div>
            <div className="filter-pill-row">
              {presentStatuses.map((s) => (
                <FilterPill
                  key={s}
                  label={s === 5 ? status5Label : t(`status${s}`)}
                  variant="status"
                  selected={statuses.includes(s)}
                  onClick={() => setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}
                />
              ))}
            </div>
          </div>
        )}

        {renderSection('categories')}
        {showTypes && renderSection('types')}
        {renderSection('locations')}

        </div>
        )}
      </div>

      <ItemGrid items={filtered} settings={settings} {...gridProps} />

      {openMore && (
        <FilterTagPickerModal
          label={labels[openMore]}
          items={options[openMore].list}
          itemCounts={options[openMore].counts}
          selectedIds={filters[openMore].included}
          excludedIds={filters[openMore].excluded}
          onApply={(included, excluded) => setFilters((prev) => ({ ...prev, [openMore]: { included, excluded } }))}
          onClose={() => setOpenMore(null)}
        />
      )}
    </>
  );
}
