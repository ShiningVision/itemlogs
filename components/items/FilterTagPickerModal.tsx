// components/items/FilterTagPickerModal.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/ui/Tooltip';
import { FilterPill } from '@/components/ui/FilterPill';
import { XMarkIcon, Bars3BottomLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export type PillOption = { id: number; name: string | null };

// The filter bar's "more" overflow entry point (see FilterPillRow /
// ItemFiltersBar) — deliberately NOT the shared TagManagerModal used for
// "Manage X". This one only ever changes which tags are active in the
// current filter, so there's no create-new-tag input. Every tag here is the
// exact same FilterPill used in the collapsed row, laid out the same way,
// and clicking one toggles it — but unlike the row itself, that toggle only
// updates local staged state, not the URL. Applying each click immediately
// meant every pill click round-tripped a full navigation/re-render while
// the person was still mid-selection, which felt like it "fired too much"
// for a picker meant to be used a few clicks at a time. The staged
// selection is only committed (via onApply) once, when the modal closes.
export function FilterTagPickerModal({
  label,
  items,
  itemCounts,
  selectedIds,
  onApply,
  onClose,
}: {
  label: string;
  items: PillOption[];
  itemCounts: Record<number, number>;
  selectedIds: number[];
  onApply: (ids: number[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations('referenceData');
  const [selection, setSelection] = useState<number[]>(selectedIds);

  function toggle(id: number) {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleClose() {
    onApply(selection);
    onClose();
  }

  // Usage first, alphabetical tiebreak by default — mirrors the pill row's
  // own default ordering (see app/dashboard/(protected)/items/page.tsx),
  // so the order here matches what the user is already used to seeing.
  const [sortMode, setSortMode] = useState<'alpha' | 'usage'>('usage');

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      if (sortMode === 'usage') {
        const usageDiff = (itemCounts[b.id] ?? 0) - (itemCounts[a.id] ?? 0);
        if (usageDiff !== 0) return usageDiff;
      }
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
    return copy;
  }, [items, itemCounts, sortMode]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          maxWidth: '480px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
            {t('filterLabel', { label })}
          </h2>
          <Tooltip text={t('close')}>
            <button
              type="button"
              onClick={handleClose}
              aria-label={t('close')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <XMarkIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
          <Tooltip text={t('sortAlpha')}>
            <button
              type="button"
              onClick={() => setSortMode('alpha')}
              aria-label={t('sortAlpha')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: sortMode === 'alpha' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                display: 'flex',
              }}
            >
              <Bars3BottomLeftIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </Tooltip>
          <Tooltip text={t('sortUsage')}>
            <button
              type="button"
              onClick={() => setSortMode('usage')}
              aria-label={t('sortUsage')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: sortMode === 'usage' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                display: 'flex',
              }}
            >
              <ChartBarIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', overflowY: 'auto' }}>
          {sortedItems.map((item) => (
            <FilterPill
              key={item.id}
              label={item.name ?? ''}
              selected={selection.includes(item.id)}
              onClick={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
