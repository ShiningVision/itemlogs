// components/gallery/GalleryDocumentCard.tsx
'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { Card } from '@/widgets/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatBytes } from '@/app/lib/storage/format-bytes';

type DocumentRow = {
  id: number;
  package_id: number | null;
  url: string;
  filename: string;
  content_type: string | null;
};

export function GalleryDocumentCard({
  document,
  sizeBytes,
  selectionMode,
  selected,
  onToggleSelect,
  onDelete,
  deleteLabel,
}: {
  document: DocumentRow;
  sizeBytes?: number;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const isImage = document.content_type?.startsWith('image/');
  const title = sizeBytes !== undefined ? formatBytes(sizeBytes) : undefined;

  return (
    <Card
      padding={false}
      style={{
        position: 'relative',
        aspectRatio: '1',
        outline: selected ? '2px solid var(--color-primary)' : undefined,
        outlineOffset: selected ? '-2px' : undefined,
      }}
    >
      <Tooltip text={document.filename}>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (selectionMode) {
              e.preventDefault();
              onToggleSelect();
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: selectionMode ? 'pointer' : 'pointer',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--color-surface)' }}>
            {isImage ? (
              <img
                src={document.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <DocumentTextIcon style={{ width: '40%', height: '40%', color: 'var(--color-text-muted)' }} />
            )}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text)',
              padding: '4px 6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {document.filename}
          </div>
        </a>
      </Tooltip>

      {title && (
        <span
          style={{
            position: 'absolute',
            bottom: '28px',
            left: 'var(--spacing-xs)',
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontSize: 'var(--font-size-xs)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            pointerEvents: 'none',
          }}
        >
          {title}
        </span>
      )}

      {selectionMode ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect();
          }}
          style={{
            position: 'absolute',
            top: 'var(--spacing-xs)',
            right: 'var(--spacing-xs)',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            border: selected ? 'none' : '2px solid #fff',
            background: selected ? 'transparent' : 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {selected && <CheckCircleIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />}
        </button>
      ) : (
        <DeleteXButton onClick={onDelete} label={deleteLabel} />
      )}
    </Card>
  );
}
