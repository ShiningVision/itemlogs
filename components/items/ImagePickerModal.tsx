// components/items/ImagePickerModal.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraIcon } from '@heroicons/react/24/outline';
import { compressImageFile } from '@/app/lib/images/compressImage';
import { Tooltip } from '@/components/ui/Tooltip';

type ImageRow = { id: number; url: string };

const PAGE_SIZE = 60;

export function ImagePickerModal({
  onSelect,
  onClose,
  excludeIds,
}: {
  onSelect: (image: ImageRow) => void;
  onClose: () => void;
  // Images already attached elsewhere (e.g. already in this item's gallery)
  // — hidden from the picker so there's no way to "select" a duplicate.
  excludeIds?: number[];
}) {
  const t = useTranslations('items');
  const [images, setImages] = useState<ImageRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const visibleImages = useMemo(() => images.filter((img) => !excludeSet.has(img.id)), [images, excludeSet]);

  async function loadMore() {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/images?offset=${offsetRef.current}&limit=${PAGE_SIZE}`);
      const json = await res.json();
      const nextImages: ImageRow[] = json.data ?? [];
      offsetRef.current += nextImages.length;
      setImages((prev) => [...prev, ...nextImages]);
      setHasMore(Boolean(json.hasMore) && nextImages.length > 0);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }

  // Load the first batch on open.
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This is a modal that mounts fresh every time it opens, and its own
  // internal div scrolls (not the page window) — so the observer's root
  // needs to be that scroll container, not the default viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();

    try {
      const compressedFile = await compressImageFile(file);
      formData.append('file', compressedFile);
      const res = await fetch('/api/v1/images', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok) {
        onSelect(json.data);
        onClose();
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        ref={scrollContainerRef}
        style={{
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('selectImage')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <Tooltip text={t('takePhoto')}>
              <label
                aria-label={t('takePhoto')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                <CameraIcon style={{ width: '18px', height: '18px' }} />
                <input type="file" accept="image/*" capture="environment" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
              </label>
            </Tooltip>
            <label
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.6 : 1,
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {isUploading ? t('uploading') : t('uploadNew')}
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
          {visibleImages.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              onClick={() => { onSelect(img); onClose(); }}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
              }}
            />
          ))}
        </div>

        {hasMore && (
          <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-md) 0' }}>
            {isLoading && (
              <span
                style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '18px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  animation: 'confirm-dialog-spin 0.6s linear infinite',
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
