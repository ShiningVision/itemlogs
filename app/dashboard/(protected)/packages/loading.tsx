// app/dashboard/(protected)/packages/loading.tsx
import { Skeleton } from '@/widgets/Skeleton';

export default function PackagesLoading() {
  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <Skeleton width="140px" height="28px" />
        <Skeleton width="120px" height="36px" />
      </div>

      <Skeleton width="160px" height="16px" style={{ marginBottom: 'var(--spacing-sm)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <Skeleton height="16px" width="70%" />
            <Skeleton height="12px" width="40%" />
            <Skeleton height="12px" width="55%" />
          </div>
        ))}
      </div>
    </div>
  );
}
