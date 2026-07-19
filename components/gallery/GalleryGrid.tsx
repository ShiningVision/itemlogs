// components/gallery/GalleryGrid.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { compressImageFile } from '@/app/lib/images/compressImage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { GalleryImageCard } from './GalleryImageCard';

type ImageRow = { id: number; url: string };

export function GalleryGrid({ initialImages, title }: { initialImages: ImageRow[]; title: string }) {
  const t = useTranslations('gallery');
  const router = useRouter();
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState<ImageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{title}</h1>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'var(--color-primary)',
            color: '#fff',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 'var(--font-weight-bold)',
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          {isUploading ? t('uploading') : t('uploadImage')}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noImages')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--spacing-md)' }}>
          {images.map((img) => (
            <GalleryImageCard
              key={img.id}
              image={img}
              onZoom={() => setZoomImage(img)}
              onDelete={() => setDeleteTarget(img)}
              deleteLabel={t('delete')}
            />
          ))}
        </div>
      )}

      {zoomImage && (
        <ImageZoomModal url={zoomImage.url} onClose={() => setZoomImage(null)} />
      )}

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
    </div>
  );
}
