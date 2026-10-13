// components/reference-data/InlineEditActions.tsx
'use client';

import { CheckIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';

// The confirm/cancel pair shown while a tag's name is being renamed inline
// (ManageFiltersModal, TagManagerModal, ReferenceDataManager). Icons instead
// of spelled-out "Save"/"Cancel" text; the labels live on as tooltips and
// aria-labels. Cancel is a "go back" arrow (undo) rather than an X so it
// can't be mistaken for the red delete button beside the name in the
// non-editing row.
export function InlineEditActions({
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  disabled = false,
}: {
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  cancelLabel: string;
  disabled?: boolean;
}) {
  const base = {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const;

  return (
    <>
      <Tooltip text={saveLabel}>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          aria-label={saveLabel}
          style={{
            ...base,
            background: 'var(--color-success)',
            color: '#fff',
            border: 'none',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <CheckIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </Tooltip>
      <Tooltip text={cancelLabel}>
        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          style={{
            ...base,
            background: 'var(--color-background)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ArrowUturnLeftIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </Tooltip>
    </>
  );
}
