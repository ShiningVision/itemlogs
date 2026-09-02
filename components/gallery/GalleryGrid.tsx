// components/gallery/GalleryGrid.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PlusIcon, CheckIcon, CameraIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { compressImageFile } from '@/app/lib/images/compressImage';
import { formatBytes } from '@/app/lib/storage/format-bytes';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { GalleryImageCard } from './GalleryImageCard';
import { GalleryDocumentCard } from './GalleryDocumentCard';
import { Tooltip } from '@/components/ui/Tooltip';

type ImageRow = { id: number; url: string };
type DocumentRow = { id: number; package_id: number; url: string; filename: string; content_type: string | null };
type SortMode = 'newest' | 'largest';
type ViewMode = 'images' | 'documents';

const PAGE_SIZE = 40;

export function GalleryGrid({
  initialImages,
  initialDocuments,
  title,
  sizeByUrl,
  orphanIds,
  imagesBytes,
  documentsBytes,
  limitBytes,
}: {
  initialImages: ImageRow[];
  initialDocuments: DocumentRow[];
  title: string;
  sizeByUrl: Record<string, number>;
  orphanIds: number[];
  imagesBytes: number;
  documentsBytes: number;
  limitBytes: number;
}) {
  const t = useTranslations('gallery');
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('images');

  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [usedImagesBytes, setUsedImagesBytes] = useState(imagesBytes);
  const [usedDocumentsBytes, setUsedDocumentsBytes] = useState(documentsBytes);

  const [isUploading, setIsUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState<ImageRow | null>(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState<ImageRow | null>(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<DocumentRow | null>(null);
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

  const visibleDocuments = useMemo(() => {
    let list = documents;
    if (sortMode === 'largest') {
      list = [...list].sort((a, b) => (sizeByUrl[b.url] ?? 0) - (sizeByUrl[a.url] ?? 0));
    }
    return list;
  }, [documents, sortMode, sizeByUrl]);

  const visibleCount = viewMode === 'images' ? visibleImages.length : visibleDocuments.length;
  const totalPages = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE));
  const pageImages = visibleImages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageDocuments = visibleDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalUsed = usedImagesBytes + usedDocumentsBytes;
  const imagesPct = limitBytes > 0 ? Math.min(100, (usedImagesBytes / limitBytes) * 100) : 0;
  const documentsPct = limitBytes > 0 ? Math.min(100, (usedDocumentsBytes / limitBytes) * 100) : 0;
  const overLimit = limitBytes > 0 && totalUsed / limitBytes > 0.9;

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    setPage(1);
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

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

  async function handleDeleteImage() {
    if (!deleteImageTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/images/${deleteImageTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsedImagesBytes((prev) => Math.max(0, prev - (sizeByUrl[deleteImageTarget.url] ?? 0)));
        setImages((prev) => prev.filter((img) => img.id !== deleteImageTarget.id));
        setDeleteImageTarget(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteDocument() {
    if (!deleteDocumentTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/documents/${deleteDocumentTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsedDocumentsBytes((prev) => Math.max(0, prev - (sizeByUrl[deleteDocumentTarget.url] ?? 0)));
        setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDocumentTarget.id));
        setDeleteDocumentTarget(null);
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
      const url = viewMode === 'images' ? '/api/v1/images/bulk' : '/api/v1/documents/bulk';
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        if (viewMode === 'images') {
          const removedBytes = images
            .filter((img) => selectedIds.has(img.id))
            .reduce((sum, img) => sum + (sizeByUrl[img.url] ?? 0), 0);
          setUsedImagesBytes((prev) => Math.max(0, prev - removedBytes));
          setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
        } else {
          const removedBytes = documents
            .filter((doc) => selectedIds.has(doc.id))
            .reduce((sum, doc) => sum + (sizeByUrl[doc.url] ?? 0), 0);
          setUsedDocumentsBytes((prev) => Math.max(0, prev - removedBytes));
          setDocuments((prev) => prev.filter((doc) => !selectedIds.has(doc.id)));
        }
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
    const pageIds = viewMode === 'images' ? pageImages.map((img) => img.id) : pageDocuments.map((doc) => doc.id);
    setSelectedIds((prev) =>
      prev.size === pageIds.length ? new Set() : new Set(pageIds)
    );
  }

  const pageSelectableCount = viewMode === 'images' ? pageImages.length : pageDocuments.length;

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
                {selectedIds.size === pageSelectableCount ? t('deselectAll') : t('selectAll')}
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
              {viewMode === 'images' && (
                <>
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
            </>
          )}
        </div>
      </div>

      {/* Images / Documents switch */}
      <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--spacing-md)' }}>
        <button
          type="button"
          onClick={() => switchView('images')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-xs) var(--spacing-md)', border: 'none', cursor: 'pointer',
            fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)',
            background: viewMode === 'images' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: viewMode === 'images' ? '#fff' : 'var(--color-text)',
          }}
        >
          <PhotoIcon style={{ width: '16px', height: '16px' }} />
          {t('viewImages', { count: images.length })}
        </button>
        <button
          type="button"
          onClick={() => switchView('documents')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-xs) var(--spacing-md)', border: 'none', cursor: 'pointer',
            fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)',
            background: viewMode === 'documents' ? 'var(--color-secondary)' : 'var(--color-surface)',
            color: viewMode === 'documents' ? '#fff' : 'var(--color-text)',
          }}
        >
          <DocumentIcon style={{ width: '16px', height: '16px' }} />
          {t('viewDocuments', { count: documents.length })}
        </button>
      </div>

      {/* Storage usage bar — split by images vs documents */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--color-border)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${imagesPct}%`,
              background: 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
          <div
            style={{
              height: '100%',
              width: `${documentsPct}%`,
              background: 'var(--color-secondary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ marginTop: 'var(--spacing-xs)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-xs)', color: overLimit ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          <span>{t('storageUsed', { used: formatBytes(totalUsed), limit: formatBytes(limitBytes) })}</span>
          {/* "Images"/"Documents" as text wrapped onto its own mobile row
              once paired with a byte count (see the tab buttons above,
              which already use these same two icons) — the icon alone
              reads just as clearly here and keeps this legend on one line.
              Full wording kept as aria-label for screen readers. */}
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            aria-label={t('storageImages', { used: formatBytes(usedImagesBytes) })}
          >
            <PhotoIcon aria-hidden="true" style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }} />
            {formatBytes(usedImagesBytes)}
          </span>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            aria-label={t('storageDocuments', { used: formatBytes(usedDocumentsBytes) })}
          >
            <DocumentIcon aria-hidden="true" style={{ width: '12px', height: '12px', color: 'var(--color-secondary)' }} />
            {formatBytes(usedDocumentsBytes)}
          </span>
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

        {viewMode === 'images' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={orphanOnly}
              onChange={(e) => { setOrphanOnly(e.target.checked); setPage(1); }}
            />
            {t('orphanedOnly')} {orphanIds.length > 0 && `(${orphanIds.length})`}
          </label>
        )}
      </div>

      {viewMode === 'images' ? (
        visibleImages.length === 0 ? (
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
                onDelete={() => setDeleteImageTarget(img)}
                deleteLabel={t('delete')}
              />
            ))}
          </div>
        )
      ) : visibleDocuments.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noDocuments')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--spacing-md)' }}>
          {pageDocuments.map((doc) => (
            <GalleryDocumentCard
              key={doc.id}
              document={doc}
              sizeBytes={sizeByUrl[doc.url]}
              selectionMode={selectionMode}
              selected={selectedIds.has(doc.id)}
              onToggleSelect={() => toggleSelect(doc.id)}
              onDelete={() => setDeleteDocumentTarget(doc)}
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

      {deleteImageTarget && (
        <ConfirmDialog
          message={t('confirmDeleteImage')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDeleteImage}
          onCancel={() => setDeleteImageTarget(null)}
          isConfirming={isDeleting}
        />
      )}

      {deleteDocumentTarget && (
        <ConfirmDialog
          message={t('confirmDeleteDocument')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeleteDocumentTarget(null)}
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
