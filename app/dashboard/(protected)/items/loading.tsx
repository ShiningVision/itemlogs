// app/dashboard/(protected)/items/loading.tsx
import { Skeleton } from '@/widgets/Skeleton';

export default function ItemsLoading() {
  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <Skeleton width="120px" height="28px" />
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Skeleton width="110px" height="36px" />
          <Skeleton width="110px" height="36px" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={`${64 + (i % 3) * 16}px`} height="28px" radius="var(--radius-full, 999px)" />
        ))}
      </div>

      <div className="skeleton-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <Skeleton height="120px" />
            <Skeleton height="14px" width="80%" />
            <Skeleton height="14px" width="50%" />
          </div>
        ))}
      </div>
    </div>
  );
}
