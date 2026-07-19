// components/ui/ConfirmDialog.tsx
'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}) {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-card" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          <ExclamationTriangleIcon style={{ width: '26px', height: '26px' }} />
        </div>

        <p className="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-cancel" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-dialog-confirm" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? <span className="confirm-dialog-spinner" aria-hidden="true" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
