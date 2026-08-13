// components/gallery/GalleryImageCard.tsx
'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { Card } from '@/widgets/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatBytes } from '@/app/lib/storage/format-bytes';

type ImageRow = { id: number; url: string };

export function GalleryImageCard({
  image,
  sizeBytes,
  isOrphan,
  orphanLabel,
  selectionMode,
  selected,
  onToggleSelect,
  onZoom,
  onDelete,
  deleteLabel,
}: {
  image: ImageRow;
  sizeBytes?: number;
  isOrphan?: boolean;
  orphanLabel?: string;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onZoom: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
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
      <Tooltip text={title}>
        <button
          type="button"
          onClick={selectionMode ? onToggleSelect : onZoom}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: selectionMode ? 'pointer' : 'zoom-in',
          }}
        >
          <img
            src={image.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </button>
      </Tooltip>

      {title && (
        <span
          style={{
            position: 'absolute',
            bottom: 'var(--spacing-xs)',
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

      {isOrphan && (
        <span
          style={{
            position: 'absolute',
            top: 'var(--spacing-xs)',
            left: 'var(--spacing-xs)',
            background: 'var(--color-warning, #d97706)',
            color: '#fff',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-bold)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            pointerEvents: 'none',
          }}
        >
          {orphanLabel}
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
