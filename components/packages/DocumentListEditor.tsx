// components/packages/DocumentListEditor.tsx
'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';
import { parseApiError } from '@/app/lib/errors/parseApiError';

export type DocumentRow = {
  id: number;
  package_id: number;
  url: string;
  filename: string;
  content_type: string | null;
};

export function DocumentListEditor({
  packageId,
  documents,
  onChange,
}: {
  packageId: number;
  documents: DocumentRow[];
  onChange: (documents: DocumentRow[]) => void;
}) {
  const t = useTranslations('packages');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/v1/packages/${packageId}/documents`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(parseApiError(json, t('documentUploadFailed')));
        return;
      }

      onChange([json.data, ...documents]);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(doc: DocumentRow) {
    setError(null);
    const res = await fetch(`/api/v1/documents/${doc.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(parseApiError(json, t('documentDeleteFailed')));
      return;
    }
    onChange(documents.filter((d) => d.id !== doc.id));
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        {documents.map((doc) => {
          const isImage = doc.content_type?.startsWith('image/');
          return (
            <div key={doc.id} style={{ position: 'relative', width: '80px' }}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {isImage ? (
                    <img
                      src={doc.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <DocumentTextIcon style={{ width: '32px', height: '32px', color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={doc.filename}
                >
                  {doc.filename}
                </div>
              </a>
              <button
                type="button"
                onClick={() => handleRemove(doc)}
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
          );
        })}

        <Tooltip text={t('addDocument')}>
          <button
            type="button"
            className="gallery-add-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t('addDocument')}
            disabled={isUploading}
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
              cursor: isUploading ? 'default' : 'pointer',
            }}
          >
            {isUploading ? (
              <span style={{ fontSize: 'var(--font-size-xs)' }}>{t('uploading')}</span>
            ) : (
              <PlusIcon style={{ width: '24px', height: '24px' }} />
            )}
          </button>
        </Tooltip>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-sm)' }}>{error}</div>
      )}
    </div>
  );
}
