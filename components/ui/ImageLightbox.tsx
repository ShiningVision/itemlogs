// components/ui/ImageLightbox.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type LightboxImage = {
  id: number | string;
  url: string;
  alt?: string;
};

export function ImageLightbox({
  images,
  startIndex,
  onClose,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  closeLabel = 'Close',
}: {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
  prevLabel?: string;
  nextLabel?: string;
  closeLabel?: string;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;

  function goPrev() {
    setIndex((i) => (i - 1 + total) % total);
  }

  function goNext() {
    setIndex((i) => (i + 1) % total);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, total]);

  if (total === 0) return null;
  const current = images[index];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 50;
    if (deltaX > SWIPE_THRESHOLD) goPrev();
    else if (deltaX < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80,
        padding: 'var(--spacing-lg)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
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

      {total > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--spacing-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            fontSize: 'var(--font-size-sm)',
            background: 'rgba(0,0,0,0.5)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {index + 1} / {total}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: 'var(--spacing-md)',
        }}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label={prevLabel}
            style={{
              width: '40px',
              height: '40px',
              flexShrink: 0,
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
            <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
          </button>
        )}

        <img
          src={current.url}
          alt={current.alt ?? ''}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '80vw',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        />

        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label={nextLabel}
            style={{
              width: '40px',
              height: '40px',
              flexShrink: 0,
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
            <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            gap: 'var(--spacing-xs)',
            overflowX: 'auto',
            maxWidth: '90vw',
            padding: 'var(--spacing-xs)',
          }}
        >
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              onClick={() => setIndex(i)}
              style={{
                width: '48px',
                height: '48px',
                flexShrink: 0,
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                border: i === index ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                opacity: i === index ? 1 : 0.7,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
