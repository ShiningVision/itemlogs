// components/packages/DocumentListEditor.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { parseApiError } from '@/app/lib/errors/parseApiError';
import { DocumentPickerModal } from './DocumentPickerModal';

export type DocumentRow = {
  id: number;
  // Nullable since documents can be uploaded package-less (see
  // app/lib/services/documents.ts) — this type must match that DocumentRow
  // shape exactly, since edit/page.tsx passes documents straight through.
  package_id: number | null;
  url: string;
  filename: string;
  content_type: string | null;
};

// The "Attach document" trigger now lives in PackageForm's header row
// (next to "Documents (count)"), so its open/close state is controlled
// from there rather than owned here — this component still owns the
// picker modal itself and the grid/remove logic.
export function DocumentListEditor({
  packageId,
  documents,
  onChange,
  isPickerOpen,
  onClosePicker,
}: {
  packageId: number;
  documents: DocumentRow[];
  onChange: (documents: DocumentRow[]) => void;
  isPickerOpen: boolean;
  onClosePicker: () => void;
}) {
  const t = useTranslations('packages');
  const [error, setError] = useState<string | null>(null);

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

      </div>

      {isPickerOpen && (
        <DocumentPickerModal
          packageId={packageId}
          onAttached={(doc) => onChange([doc, ...documents])}
          onClose={onClosePicker}
        />
      )}

      {error && (
        <div style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-sm)' }}>{error}</div>
      )}
    </div>
  );
}
