// components/ui/FilterPill.tsx
'use client';

import { forwardRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export const FilterPill = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
    // 'status' reads as a visually separate group from Category/Type/Location
    // (which are otherwise identically styled, on purpose — see
    // ItemFiltersBar) via squarer corners instead of the full pill capsule,
    // no color/border trick involved.
    // 'more' is the FilterPillRow overflow control — styled like any other
    // tag (so it visually belongs in the row) but in a fixed accent color,
    // since it isn't a toggle: it always looks the same regardless of
    // `selected`. The forwarded ref lets FilterPillRow measure this
    // variant's rendered width for its overflow calculation.
    variant?: 'default' | 'status' | 'more';
  }
>(function FilterPill({ label, selected, disabled, onClick, variant = 'default' }, ref) {
  const background = variant === 'more' ? 'var(--color-secondary)' : selected ? 'var(--color-primary)' : 'var(--color-surface)';
  const color = variant === 'more' || selected ? '#fff' : 'var(--color-text)';
  // Selected state shouldn't rely on color/fill alone — a checkmark gives a
  // second, non-color cue. Not shown on 'more', which isn't a toggle.
  const showCheck = selected && variant !== 'more';
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: variant === 'status' ? 'var(--radius-sm)' : 'var(--radius-full)',
        border: 'none',
        padding: 'var(--spacing-xs) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: selected || variant === 'more' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
        background,
        color,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background var(--motion-duration) var(--motion-easing)',
        whiteSpace: 'nowrap',
      }}
    >
      {showCheck && <CheckIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />}
      {label}
    </button>
  );
});
