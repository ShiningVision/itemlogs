// components/items/MainImagePicker.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';

type ImageRow = { id: number; url: string };

export function MainImagePicker({
  value,
  onChange,
  excludeIds,
  galleryImages = [],
}: {
  value: ImageRow | null;
  onChange: (image: ImageRow) => void;
  excludeIds?: number[];
  // The item's gallery images, so the zoom popup can flip through them after
  // the main image — same lightbox as the visitor page's item gallery (and
  // as ImageGalleryEditor's thumbnails).
  galleryImages?: ImageRow[];
}) {
  const t = useTranslations('items');
  const storefrontT = useTranslations('storefront');
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div>
      <div
        onClick={value?.url ? () => setZoomOpen(true) : undefined}
        style={{
          width: '160px',
          aspectRatio: '1',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-sm)',
          overflow: 'hidden',
          cursor: value?.url ? 'zoom-in' : undefined,
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
        <ImagePickerModal onSelect={onChange} onClose={() => setModalOpen(false)} excludeIds={excludeIds} />
      )}

      {zoomOpen && value?.url && (
        <ImageLightbox
          images={[value, ...galleryImages].map((img) => ({ id: img.id, url: img.url }))}
          startIndex={0}
          onClose={() => setZoomOpen(false)}
          prevLabel={storefrontT('prevImage')}
          nextLabel={storefrontT('nextImage')}
          closeLabel={storefrontT('close')}
        />
      )}
    </div>
  );
}