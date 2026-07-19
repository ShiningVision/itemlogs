// components/items/ImagePickerModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { compressImageFile } from '@/app/lib/images/compressImage';

type ImageRow = { id: number; url: string };

export function ImagePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (image: ImageRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations('items');
  const [images, setImages] = useState<ImageRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/images')
      .then((res) => res.json())
      .then((res) => setImages(res.data ?? []));
  }, []);

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
          <label
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {isUploading ? t('uploading') : t('uploadNew')}
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
          {images.map((img) => (
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
      </div>
    </div>
  );
}