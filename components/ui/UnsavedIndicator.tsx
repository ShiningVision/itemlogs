// components/ui/UnsavedIndicator.tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

// Visible cues that an edit form has unsaved changes, driven by the same
// isDirty flag as useUnsavedChangesGuard:
//  - <UnsavedBadge/>: an amber "Unsaved changes" pill, placed next to the title
//  - useUnsavedTitle(): prefixes the browser tab title with a dot
//  - <SaveDot/>: a small dot inside the Save button
//  - saveButtonStyle(): dims Save while there is nothing to save (still
//    clickable — dirty tracking can't see every kind of change)

export function UnsavedBadge({ show }: { show: boolean }) {
  const t = useTranslations('unsavedChanges');
  if (!show) return null;
  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginLeft: 'var(--spacing-sm)',
        padding: '2px 10px',
        verticalAlign: 'middle',
        border: '1px solid var(--color-warning)',
        background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
        color: 'var(--color-warning)',
        borderRadius: '999px',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        whiteSpace: 'nowrap',
      }}
    >
      <SaveDot show />
      {t('badge')}
    </span>
  );
}

export function SaveDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden="true"
      style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)', display: 'inline-block', flexShrink: 0 }}
    />
  );
}

export function useUnsavedTitle(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const original = document.title;
    document.title = `• ${original}`;
    return () => {
      document.title = original;
    };
  }, [isDirty]);
}

export function saveButtonStyle(isUpdate: boolean, isDirty: boolean): React.CSSProperties | undefined {
  return isUpdate && !isDirty ? { opacity: 0.6 } : undefined;
}
