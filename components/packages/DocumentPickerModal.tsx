// components/packages/DocumentPickerModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { parseApiError } from '@/app/lib/errors/parseApiError';
import type { DocumentRow } from './DocumentListEditor';

// Mirrors ImagePickerModal.tsx (items) — "attach something already
// uploaded, or upload something new" in one modal, rather than only ever
// uploading fresh. No pagination/infinite-scroll here unlike that one: the
// underlying GET is the same un-paginated list the Gallery's Documents view
// already uses (see app/api/v1/documents/route.ts), just narrowed to
// package-less rows via ?unassigned=1 — tenants aren't likely to have
// hundreds of unattached documents sitting around the way they might with
// images.
export function DocumentPickerModal({
  packageId,
  onAttached,
  onClose,
}: {
  packageId: number;
  onAttached: (document: DocumentRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations('packages');
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [attachingId, setAttachingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/documents?unassigned=1');
        const json = await res.json();
        if (!cancelled) setDocuments(json.data ?? []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelectExisting(doc: DocumentRow) {
    setError(null);
    setAttachingId(doc.id);
    try {
      const res = await fetch(`/api/v1/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(parseApiError(json, t('documentAttachFailed')));
        return;
      }
      onAttached(json.data);
      onClose();
    } finally {
      setAttachingId(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/v1/packages/${packageId}/documents`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(parseApiError(json, t('documentUploadFailed')));
        return;
      }
      onAttached(json.data);
      onClose();
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
          <h2 style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('selectDocument')}</h2>
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
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>

        {!isLoading && documents.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('noUnassignedDocuments')}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 'var(--spacing-sm)' }}>
          {documents.map((doc) => {
            const isImage = doc.content_type?.startsWith('image/');
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectExisting(doc)}
                disabled={attachingId !== null}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--spacing-xs)',
                  cursor: attachingId !== null ? 'default' : 'pointer',
                  opacity: attachingId !== null && attachingId !== doc.id ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {isImage ? (
                    <img src={doc.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <DocumentTextIcon style={{ width: '28px', height: '28px', color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={doc.filename}
                >
                  {attachingId === doc.id ? t('adding') : doc.filename}
                </div>
              </button>
            );
          })}
        </div>

        {error && <div style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-sm)' }}>{error}</div>}
      </div>
    </div>
  );
}
