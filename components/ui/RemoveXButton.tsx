// components/ui/RemoveXButton.tsx
'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

// A compact corner button for "unlink this item from its current context"
// actions (remove from package, remove from sale) — same shape/position as
// DeleteXButton so the app has one consistent "X in the corner" language,
// but neutral by default (only turns danger-red on hover) since this isn't
// a destructive delete of the item itself.
export function RemoveXButton({
  onClick,
  label,
  disabled,
  loading,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className="remove-x-button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {loading ? <span className="remove-x-button-spinner" aria-hidden="true" /> : <XMarkIcon style={{ width: '16px', height: '16px' }} />}
    </button>
  );
}
