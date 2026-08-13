// components/items/ItemFiltersBar.tsx
'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FilterPill } from '@/components/ui/FilterPill';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';

type FilterOption = { id: number; name: string | null };

function ManageButton({ href, label }: { href: string; label?: string }) {
  return (
    <Link href={href}>
      <button
        type="button"
        style={{
          background: 'var(--color-secondary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-bold)',
        }}
      >
        {label}
      </button>
    </Link>
  );
}

export function ItemFiltersBar({
  categories,
  types,
  selectedCategoryIds,
  selectedStatuses,
  selectedTypeId,
  sellModeActive = false,
  categoryLabel,
  typeLabel,
  statusLabel,
  availableStatuses = [1, 2, 3, 4],
  manageCategoriesHref,
  manageCategoriesLabel,
  manageTypesHref,
  manageTypesLabel,
}: {
  categories: FilterOption[];
  types: FilterOption[];
  selectedCategoryIds: number[];
  selectedStatuses: number[];
  selectedTypeId: number | undefined;
  sellModeActive?: boolean;
  categoryLabel: string;
  typeLabel: string;
  statusLabel?: string;
  availableStatuses?: number[];
  manageCategoriesHref?: string;
  manageCategoriesLabel?: string;
  manageTypesHref?: string;
  manageTypesLabel?: string;
}) {
  const t = useTranslations('items');
  const { isPending, setParam, toggleInList } = useFilterParams();

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
    manageHref?: string,
    manageLabel?: string,
    onToggle?: (selected: number[], id: number) => void,
  ) {
    return (
      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{label}</span>
          {manageHref && <ManageButton href={manageHref} label={manageLabel} />}
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
        manageCategoriesHref,
        manageCategoriesLabel,
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

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">{typeLabel}</span>
          {manageTypesHref && <ManageButton href={manageTypesHref} label={manageTypesLabel} />}
        </div>
        <select
          value={selectedTypeId ?? ''}
          onChange={(e) => setParam('type', e.target.value || null)}
          className="sheet-input"
          style={{ maxWidth: '280px' }}
        >
          <option value="">{t('allLabel', { label: typeLabel })}</option>
          {types.map((tp) => (
            <option key={tp.id} value={tp.id}>{tp.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
