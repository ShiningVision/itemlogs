// components/items/FilterTagPickerModal.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/ui/Tooltip';
import { FilterPill } from '@/components/ui/FilterPill';
import { Button } from '@/widgets/Button';
import { XMarkIcon, CheckIcon, Bars3BottomLeftIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  // Client-side substring filter — this modal's whole point is being the
  // "there are more than fit in the row" overflow, so it's exactly the
  // case where a tenant with a long tag list benefits from being able to
  // narrow it down instead of hunting through every pill.
  const [search, setSearch] = useState('');

  const sortedItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? items.filter((item) => (item.name ?? '').toLowerCase().includes(query)) : items;
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortMode === 'usage') {
        const usageDiff = (itemCounts[b.id] ?? 0) - (itemCounts[a.id] ?? 0);
        if (usageDiff !== 0) return usageDiff;
      }
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
    return copy;
  }, [items, itemCounts, sortMode, search]);

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

        <div style={{ position: 'relative', marginBottom: 'var(--spacing-sm)' }}>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              paddingLeft: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
          {selection.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelection([])}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              {t('clearSelection')}
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
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
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', overflowY: 'auto' }}>
          {sortedItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{t('noSearchResults')}</p>
          ) : (
            sortedItems.map((item) => (
              <FilterPill
                key={item.id}
                label={item.name ?? ''}
                selected={selection.includes(item.id)}
                onClick={() => toggle(item.id)}
              />
            ))
          )}
        </div>

        {/* Backdrop click and the X both already apply-then-close (see
            handleClose) — this button is a second way to do the exact same
            thing, for the bottom-right-corner "confirm" reflex a modal like
            this naturally invites, same spot TagManagerModal's own
            multi-select Confirm button uses. */}
        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>
            <CheckIcon style={{ width: '16px', height: '16px' }} />
            {t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
