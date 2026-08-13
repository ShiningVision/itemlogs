// components/gallery/GalleryGrid.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PlusIcon, CheckIcon, CameraIcon } from '@heroicons/react/24/outline';
import { compressImageFile } from '@/app/lib/images/compressImage';
import { formatBytes } from '@/app/lib/storage/format-bytes';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { GalleryImageCard } from './GalleryImageCard';
import { Tooltip } from '@/components/ui/Tooltip';

type ImageRow = { id: number; url: string };
type SortMode = 'newest' | 'largest';

const PAGE_SIZE = 40;

export function GalleryGrid({
  initialImages,
  title,
  sizeByUrl,
  orphanIds,
  usedBytes,
  limitBytes,
}: {
  initialImages: ImageRow[];
  title: string;
  sizeByUrl: Record<string, number>;
  orphanIds: number[];
  usedBytes: number;
  limitBytes: number;
}) {
  const t = useTranslations('gallery');
  const router = useRouter();
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [used, setUsed] = useState(usedBytes);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState<ImageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const orphanSet = useMemo(() => new Set(orphanIds), [orphanIds]);

  const visibleImages = useMemo(() => {
    let list = orphanOnly ? images.filter((img) => orphanSet.has(img.id)) : images;
    if (sortMode === 'largest') {
      list = [...list].sort((a, b) => (sizeByUrl[b.url] ?? 0) - (sizeByUrl[a.url] ?? 0));
    }
    return list;
  }, [images, orphanOnly, orphanSet, sortMode, sizeByUrl]);

  const totalPages = Math.max(1, Math.ceil(visibleImages.length / PAGE_SIZE));
  const pageImages = visibleImages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const usedPct = limitBytes > 0 ? Math.min(100, (used / limitBytes) * 100) : 0;

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
        setImages((prev) => [json.data, ...prev]);
        router.refresh();
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/images/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsed((prev) => Math.max(0, prev - (sizeByUrl[deleteTarget.url] ?? 0)));
        setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await fetch('/api/v1/images/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const removedBytes = images
          .filter((img) => selectedIds.has(img.id))
          .reduce((sum, img) => sum + (sizeByUrl[img.url] ?? 0), 0);
        setUsed((prev) => Math.max(0, prev - removedBytes));
        setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
        setSelectedIds(new Set());
        setSelectionMode(false);
        setConfirmBulkDelete(false);
        router.refresh();
      }
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === pageImages.length ? new Set() : new Set(pageImages.map((img) => img.id))
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
              >
                {selectedIds.size === pageImages.length ? t('deselectAll') : t('selectAll')}
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setConfirmBulkDelete(true)}
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-danger)', color: '#fff', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.size === 0 ? 0.6 : 1, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}
              >
                {t('deleteSelected', { count: selectedIds.size })}
              </button>
              <button
                type="button"
                onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
              >
                {t('cancelSelection')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
              >
                <CheckIcon style={{ width: '16px', height: '16px' }} />
                {t('select')}
              </button>
              <Tooltip text={t('takePhoto')}>
                <label
                  className="gallery-camera-btn"
                  aria-label={t('takePhoto')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}
                >
                  <CameraIcon style={{ width: '18px', height: '18px' }} />
                  <input type="file" accept="image/*" capture="environment" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
                </label>
              </Tooltip>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', background: 'var(--color-primary)', color: '#fff', padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--radius-md)', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 'var(--font-weight-bold)', opacity: isUploading ? 0.6 : 1, fontSize: 'var(--font-size-sm)' }}>
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                {isUploading ? t('uploading') : t('uploadImage')}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Storage usage bar */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--color-border)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${usedPct}%`,
              background: usedPct > 90 ? 'var(--color-danger)' : 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {t('storageUsed', { used: formatBytes(used), limit: formatBytes(limitBytes) })}
        </div>
      </div>

      {/* Sort + filter controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <select
          value={sortMode}
          onChange={(e) => { setSortMode(e.target.value as SortMode); setPage(1); }}
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}
        >
          <option value="newest">{t('sortNewest')}</option>
          <option value="largest">{t('sortLargest')}</option>
        </select>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={orphanOnly}
            onChange={(e) => { setOrphanOnly(e.target.checked); setPage(1); }}
          />
          {t('orphanedOnly')} {orphanIds.length > 0 && `(${orphanIds.length})`}
        </label>
      </div>

      {visibleImages.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{orphanOnly ? t('noOrphanImages') : t('noImages')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--spacing-md)' }}>
          {pageImages.map((img) => (
            <GalleryImageCard
              key={img.id}
              image={img}
              sizeBytes={sizeByUrl[img.url]}
              isOrphan={orphanSet.has(img.id)}
              orphanLabel={t('orphanedBadge')}
              selectionMode={selectionMode}
              selected={selectedIds.has(img.id)}
              onToggleSelect={() => toggleSelect(img.id)}
              onZoom={() => setZoomImage(img)}
              onDelete={() => setDeleteTarget(img)}
              deleteLabel={t('delete')}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
          >
            ‹
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'default' : 'pointer' }}
          >
            ›
          </button>
        </div>
      )}

      {zoomImage && <ImageZoomModal url={zoomImage.url} onClose={() => setZoomImage(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          message={t('confirmDeleteImage')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={isDeleting}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          message={t('confirmDeleteSelected', { count: selectedIds.size })}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
          isConfirming={isBulkDeleting}
        />
      )}
    </div>
  );
}
