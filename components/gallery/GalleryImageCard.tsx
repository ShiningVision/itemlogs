// components/gallery/GalleryImageCard.tsx
'use client';

import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { Card } from '@/widgets/Card';

type ImageRow = { id: number; url: string };

export function GalleryImageCard({
  image,
  onZoom,
  onDelete,
  deleteLabel,
}: {
  image: ImageRow;
  onZoom: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <Card padding={false} style={{ position: 'relative', aspectRatio: '1' }}>
      <button
        type="button"
        onClick={onZoom}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'zoom-in',
        }}
      >
        <img
          src={image.url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </button>

      <DeleteXButton onClick={onDelete} label={deleteLabel} />
    </Card>
  );
}
