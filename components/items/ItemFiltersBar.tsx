// components/items/ItemFiltersBar.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPill } from '@/components/ui/FilterPill';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { TagManagerModal } from '@/components/reference-data/TagManagerModal';

type FilterOption = { id: number; name: string | null };
type ManagedResource = 'category' | 'type' | 'location';

function ManageButton({ label, onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--color-secondary)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

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
  selectedLocationId,
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
  selectedLocationId: number | undefined;
  sellModeActive?: boolean;
  categoryLabel: string;
  typeLabel: string;
  locationLabel: string;
  statusLabel?: string;
  availableStatuses?: number[];
}) {
  const t = useTranslations('items');
  const { isPending, setParam, toggleInList } = useFilterParams();
  // Which "Manage X" modal (if any) is currently open — kept local to this
  // component rather than lifted to the page, since it's fed entirely by
  // props this component already has (categories/types/locations +
  // their item counts). See TagManagerModal for the shared modal itself.
  const [openManager, setOpenManager] = useState<ManagedResource | null>(null);

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

  function renderPillSection(
    key: string,
    label: string,
    options: Array<{ id: number; label: string; disabled?: boolean }>,
    selected: number[],
    onManage?: () => void,
    manageLabel?: string,
    onToggle?: (selected: number[], id: number) => void,
  ) {
    return (
      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{label}</span>
          {onManage && <ManageButton label={manageLabel} onClick={onManage} />}
        </div>
        <div className="filter-pill-row">
          {options.map((opt) => (
            <FilterPill
              key={opt.id}
              label={opt.label}
              selected={selected.includes(opt.id)}
              disabled={opt.disabled}
              onClick={() => (onToggle ? onToggle(selected, opt.id) : toggleInList(key, selected, opt.id))}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="item-filters-card">
      <div className="item-filters-header">
        <span>{t('filtersTitle')}</span>
        {isPending && <span className="item-filters-status">{t('searching')}</span>}
      </div>

      {renderPillSection(
        'categories',
        categoryLabel,
        categories.map((c) => ({ id: c.id, label: c.name ?? '' })),
        selectedCategoryIds,
        () => setOpenManager('category'),
        t('manageLabel', { label: categoryLabel }),
      )}

      {renderPillSection(
        'statuses',
        statusLabel ?? t('filterStatuses'),
        availableStatuses.map((s) => ({ id: s, label: t(`status${s}`), disabled: sellModeActive })),
        sellModeActive ? [1] : selectedStatuses,
        undefined,
        undefined,
        sellModeActive ? undefined : toggleStatus,
      )}

      {renderPillSection(
        'types',
        typeLabel,
        types.map((tp) => ({ id: tp.id, label: tp.name ?? '' })),
        selectedTypeIds,
        () => setOpenManager('type'),
        t('manageLabel', { label: typeLabel }),
      )}

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{locationLabel}</span>
          <ManageButton label={t('manageLabel', { label: locationLabel })} onClick={() => setOpenManager('location')} />
        </div>
        <select
          value={selectedLocationId ?? ''}
          onChange={(e) => setParam('location', e.target.value || null)}
          className="sheet-input"
          style={{ maxWidth: '280px' }}
        >
          <option value="">{t('allLabel', { label: locationLabel })}</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* The "Other" pill (id 0, synthetic — see OTHER_FILTER_ID in
          app/lib/services/items.ts) is appended into `categories`/`types`
          purely for filtering; it isn't a real row and must never be
          offered as something to rename/delete in the manage modal. */}
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
    </div>
  );
}
