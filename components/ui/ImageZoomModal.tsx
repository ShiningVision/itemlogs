// components/ui/ImageZoomModal.tsx
'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function ImageZoomModal({
  url,
  alt = '',
  onClose,
}: {
  url: string;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80,
        padding: 'var(--spacing-lg)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: 'var(--spacing-lg)',
          right: 'var(--spacing-lg)',
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <XMarkIcon style={{ width: '20px', height: '20px' }} />
      </button>

      <img
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
        }}
      />
    </div>
  );
}
