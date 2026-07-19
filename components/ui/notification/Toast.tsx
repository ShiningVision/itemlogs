// components/ui/notification/Toast.tsx
'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

export function Toast({
  message,
  type = 'success',
  onClose,
  durationMs = 4000,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        zIndex: 100,
        background: type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)',
        color: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        maxWidth: '320px',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        ×
      </button>
    </div>
  );
}
