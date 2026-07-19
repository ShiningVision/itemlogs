// components/items/MainImagePicker.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ImagePickerModal } from './ImagePickerModal';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';

type ImageRow = { id: number; url: string };

export function MainImagePicker({
  value,
  onChange,
}: {
  value: ImageRow | null;
  onChange: (image: ImageRow) => void;
}) {
  const t = useTranslations('items');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div
        style={{
          width: '160px',
          aspectRatio: '1',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-sm)',
          overflow: 'hidden',
        }}
      >
        {value?.url ? (
          <img src={value.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <NoImagePlaceholder label={t('noImage')} />
        )}
      </div>
      <button
        type="button"
        className="main-image-picker-btn"
        onClick={() => setModalOpen(true)}
        style={{
          width: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-sm)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-bold)',
          cursor: 'pointer',
        }}
      >
        <PhotoIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('selectOrUploadImage')}
        </span>
      </button>

      {modalOpen && (
        <ImagePickerModal onSelect={onChange} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}