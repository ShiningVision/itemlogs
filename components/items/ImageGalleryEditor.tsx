// components/items/ImageGalleryEditor.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ImagePickerModal } from './ImagePickerModal';

type ImageRow = { id: number; url: string };

export function ImageGalleryEditor({
  images,
  onAdd,
  onRemove,
}: {
  images: ImageRow[];
  onAdd: (image: ImageRow) => void;
  onRemove: (imageId: number) => void;
}) {
  const t = useTranslations('items');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
            <img
              src={img.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            />
            <button
              type="button"
              onClick={() => onRemove(img.id)}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'var(--color-danger)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="gallery-add-btn"
          onClick={() => setModalOpen(true)}
          aria-label={t('addGalleryImage')}
          title={t('addGalleryImage')}
          style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <PlusIcon style={{ width: '24px', height: '24px' }} />
        </button>
      </div>

      {modalOpen && (
        <ImagePickerModal
          onSelect={(img) => onAdd(img)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}