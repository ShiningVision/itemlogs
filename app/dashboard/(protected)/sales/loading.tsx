// app/dashboard/(protected)/sales/loading.tsx
import { Skeleton } from '@/widgets/Skeleton';

export default function SalesLoading() {
  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <Skeleton width="100px" height="28px" />
        <Skeleton width="100px" height="36px" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton width="120px" height="14px" style={{ marginBottom: 'var(--spacing-sm)' }} />
            <div className="skeleton-row">
              <Skeleton width="48px" height="48px" radius="var(--radius-md)" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <Skeleton height="14px" width="60%" />
                <Skeleton height="12px" width="30%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
