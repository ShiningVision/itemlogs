// app/dashboard/(protected)/categories/loading.tsx
import { Skeleton } from '@/widgets/Skeleton';

export default function CategoriesLoading() {
  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '480px', width: '100%', marginInline: 'auto' }}>
      <Skeleton width="180px" height="22px" style={{ marginBottom: 'var(--spacing-lg)' }} />

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <Skeleton height="36px" style={{ flex: 1 }} />
        <Skeleton width="70px" height="36px" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <Skeleton height="14px" style={{ flex: 1 }} />
            <Skeleton width="50px" height="28px" />
          </div>
        ))}
      </div>
    </div>
  );
}
