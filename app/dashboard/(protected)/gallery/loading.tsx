// app/dashboard/(protected)/gallery/loading.tsx
import { Skeleton } from '@/widgets/Skeleton';

export default function GalleryLoading() {
  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <Skeleton width="100px" height="28px" style={{ marginBottom: 'var(--spacing-sm)' }} />
      <Skeleton width="220px" height="14px" style={{ marginBottom: 'var(--spacing-lg)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--spacing-md)' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} height="160px" radius="var(--radius-md)" />
        ))}
      </div>
    </div>
  );
}
