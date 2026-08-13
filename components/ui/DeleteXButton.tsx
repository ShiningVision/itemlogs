// components/ui/DeleteXButton.tsx
'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';

export function DeleteXButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip text={label}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        aria-label={label}
        style={{
          position: 'absolute',
          top: 'var(--spacing-xs)',
          right: 'var(--spacing-xs)',
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-danger)',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          zIndex: 2,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <XMarkIcon style={{ width: '16px', height: '16px' }} />
      </button>
    </Tooltip>
  );
}
