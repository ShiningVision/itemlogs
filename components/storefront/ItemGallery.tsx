// components/storefront/ItemGallery.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

type GalleryImage = { id: number; url: string };

const MAX_VISIBLE_THUMBS = 7;

export function ItemGallery({
  mainImage,
  galleryImages,
  itemName,
  noImageLabel,
}: {
  mainImage: GalleryImage | null;
  galleryImages: GalleryImage[];
  itemName: string;
  noImageLabel: string;
}) {
  const t = useTranslations('storefront');
  const images = useMemo(() => {
    return mainImage ? [mainImage, ...galleryImages] : galleryImages;
  }, [mainImage, galleryImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="sheet-portrait-frame">
        <div style={{ width: '100%', aspectRatio: '1' }}>
          <NoImagePlaceholder label={noImageLabel} />
        </div>
      </div>
    );
  }

  const total = images.length;
  const active = images[activeIndex];
  const hasOverflow = total > MAX_VISIBLE_THUMBS;
  const visibleThumbs = hasOverflow ? images.slice(0, MAX_VISIBLE_THUMBS - 1) : images;
  const hiddenCount = hasOverflow ? total - (MAX_VISIBLE_THUMBS - 1) : 0;

  function showPrev(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveIndex((i) => (i - 1 + total) % total);
  }

  function showNext(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveIndex((i) => (i + 1) % total);
  }

  return (
    <>
      <div className="sheet-portrait-frame" style={{ position: 'relative' }}>
        <img
          src={active.url}
          alt={itemName}
          onClick={() => setLightboxIndex(activeIndex)}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer' }}
        />
        {total > 1 && (
          <>
            <button
              type="button"
              className="sheet-portrait-nav-btn sheet-portrait-nav-btn--prev"
              aria-label={t('prevImage')}
              onClick={showPrev}
            >
              <ChevronLeftIcon style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              type="button"
              className="sheet-portrait-nav-btn sheet-portrait-nav-btn--next"
              aria-label={t('nextImage')}
              onClick={showNext}
            >
              <ChevronRightIcon style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="sheet-portrait-counter">
              {activeIndex + 1} / {total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="sheet-inventory-row">
          {visibleThumbs.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              onClick={() => setActiveIndex(i)}
              className={
                i === activeIndex
                  ? 'sheet-inventory-thumb sheet-inventory-thumb--active'
                  : 'sheet-inventory-thumb'
              }
            />
          ))}
          {hasOverflow && (
            <div
              className="sheet-inventory-more-tile"
              onClick={() => setLightboxIndex(MAX_VISIBLE_THUMBS - 1)}
            >
              {t('moreImages', { count: hiddenCount })}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map((img) => ({ id: img.id, url: img.url, alt: itemName }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          prevLabel={t('prevImage')}
          nextLabel={t('nextImage')}
          closeLabel={t('close')}
        />
      )}
    </>
  );
}
