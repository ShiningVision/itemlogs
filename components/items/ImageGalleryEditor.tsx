// components/items/ImageGalleryEditor.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ImagePickerModal } from './ImagePickerModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

type ImageRow = { id: number; url: string };

export function ImageGalleryEditor({
  images,
  onAdd,
  onRemove,
  additionalExcludeIds = [],
  mainImage = null,
}: {
  images: ImageRow[];
  onAdd: (image: ImageRow) => void | Promise<void>;
  onRemove: (imageId: number) => void;
  additionalExcludeIds?: number[];
  // Only used for the zoom popup: the main image is shown first in it, same
  // as the visitor page's item gallery (see components/storefront/
  // ItemGallery.tsx), so flipping through covers every picture of the item.
  mainImage?: ImageRow | null;
}) {
  const t = useTranslations('items');
  // Reused from the storefront namespace — same lightbox, same labels.
  const storefrontT = useTranslations('storefront');
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages = mainImage ? [mainImage, ...images] : images;
  const lightboxOffset = mainImage ? 1 : 0;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        {images.map((img, i) => (
          <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
            <img
              src={img.url}
              alt=""
              onClick={() => setLightboxIndex(i + lightboxOffset)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'zoom-in' }}
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

        <Tooltip text={t('addGalleryImage')}>
          <button
            type="button"
            className="gallery-add-btn"
            onClick={() => setModalOpen(true)}
            aria-label={t('addGalleryImage')}
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
        </Tooltip>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages.map((img) => ({ id: img.id, url: img.url }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          prevLabel={storefrontT('prevImage')}
          nextLabel={storefrontT('nextImage')}
          closeLabel={storefrontT('close')}
        />
      )}

      {modalOpen && (
        <ImagePickerModal
          onSelect={(img) => onAdd(img)}
          onClose={() => setModalOpen(false)}
          multiple
          excludeIds={[...images.map((img) => img.id), ...additionalExcludeIds]}
        />
      )}
    </div>
  );
}