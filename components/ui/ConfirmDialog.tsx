// components/ui/ConfirmDialog.tsx
'use client';

import { createPortal } from 'react-dom';
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
  // Rendered via a portal straight into <body>. Callers often open this from
  // inside a hovered `.interactive-card` (e.g. item/package/sale cards),
  // which applies a CSS `transform` on hover — and any transformed ancestor
  // becomes the containing block for `position: fixed` descendants. Without
  // the portal, the "fixed" overlay ends up confined to that card's box
  // instead of the viewport, which is what made the dialog look like it was
  // rendering inside the card with its buttons overflowing the edge.
  if (typeof document === 'undefined') return null;

  return createPortal(
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
    </div>,
    document.body
  );
}
