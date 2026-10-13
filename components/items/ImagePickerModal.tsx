// components/items/ImagePickerModal.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraIcon } from '@heroicons/react/24/outline';
import { uploadImageFiles } from '@/app/lib/images/uploadImages';
import { useBeforeUnloadWhile } from '@/app/lib/hooks/useBeforeUnloadWhile';
import { formatBytes } from '@/app/lib/storage/format-bytes';
import { MAX_UPLOAD_BYTES } from '@/app/lib/storage/upload-limits';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/widgets/Button';

type ImageRow = { id: number; url: string };

const PAGE_SIZE = 60;

export function ImagePickerModal({
  onSelect,
  onClose,
  excludeIds,
  multiple = false,
}: {
  onSelect: (image: ImageRow) => void | Promise<void>;
  onClose: () => void;
  // Images already attached elsewhere (e.g. already in this item's gallery)
  // — hidden from the picker so there's no way to "select" a duplicate.
  excludeIds?: number[];
  // Multi-image mode, for adding to an item's gallery: "Upload new" takes
  // several files (each handed to onSelect as it lands), and tapping library
  // images toggles them into a selection that's added together with the
  // "Add N images" button. Off for single-image uses (the item's main
  // image), where one tap picks and closes.
  multiple?: boolean;
}) {
  const t = useTranslations('items');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  function toggleSelected(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleAddSelected() {
    setIsAdding(true);
    try {
      // In the order they were tapped, one at a time so each add finishes
      // before the next starts.
      for (const id of selectedIds) {
        const img = images.find((i) => i.id === id);
        if (img) await onSelect(img);
      }
      onClose();
    } finally {
      setIsAdding(false);
    }
  }
  // Upload messages/limits live with the Gallery page's strings.
  const galleryT = useTranslations('gallery');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
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
    // Copied out before the input is reset (clearing `value` empties the
    // live FileList). Only the first file counts unless multiple is allowed.
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const files = multiple ? picked : picked.slice(0, 1);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      // Each image is handed to onSelect the moment it lands.
      const { tooLarge, failed } = await uploadImageFiles(
        files,
        (image) => onSelect(image),
        (done, total) => setUploadProgress({ done, total })
      );
      const failures = tooLarge + failed;
      if (failures === 0) {
        onClose();
        return;
      }
      // Something failed — stay open so the message is seen (images that did
      // upload were already handed to onSelect and are in the item).
      if (files.length === 1) {
        setUploadError(
          tooLarge > 0 ? galleryT('fileTooLarge', { limit: formatBytes(MAX_UPLOAD_BYTES) }) : galleryT('uploadFailed')
        );
      } else {
        setUploadError(
          galleryT('uploadSomeFailed', { failed: failures, total: files.length, limit: formatBytes(MAX_UPLOAD_BYTES) })
        );
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }
  useBeforeUnloadWhile(isUploading);

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
              <input type="file" accept="image/*" multiple={multiple} onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
            </label>
          </div>
        </div>

        {/* Shown for the whole upload: closing the app mid-upload cuts it
            off, and phones can't show a native "leave?" prompt. */}
        {isUploading && (
          <div
            role="status"
            style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}
          >
            {uploadProgress
              ? galleryT('uploadingProgress', { done: Math.min(uploadProgress.done + 1, uploadProgress.total), total: uploadProgress.total })
              : galleryT('uploading')}
          </div>
        )}
        {uploadError && !isUploading && (
          <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
            {uploadError}
          </div>
        )}

        {multiple && (
          <p style={{ margin: '0 0 var(--spacing-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {t('selectImagesHint')}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
          {visibleImages.map((img) => {
            const isSelected = selectedIds.includes(img.id);
            return (
              <img
                key={img.id}
                src={img.url}
                alt=""
                onClick={() => {
                  if (multiple) {
                    toggleSelected(img.id);
                  } else {
                    onSelect(img);
                    onClose();
                  }
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  outline: isSelected ? '3px solid var(--color-primary)' : undefined,
                  outlineOffset: isSelected ? '-3px' : undefined,
                  opacity: multiple && selectedIds.length > 0 && !isSelected ? 0.6 : 1,
                }}
              />
            );
          })}
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

        {/* Sticks to the bottom of the scrolling modal so it's reachable no
            matter how far down the library has been scrolled. */}
        {multiple && selectedIds.length > 0 && (
          <div
            style={{
              position: 'sticky',
              bottom: 'calc(-1 * var(--spacing-lg))',
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-sm) 0',
              background: 'var(--color-background)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button onClick={handleAddSelected} disabled={isAdding}>
              {isAdding ? t('saving') : t('addSelectedImages', { count: selectedIds.length })}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
