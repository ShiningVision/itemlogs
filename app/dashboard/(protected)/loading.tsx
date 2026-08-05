import { Skeleton } from '@/widgets/Skeleton';

// Generic fallback for any dashboard route that doesn't define its own
// more specific loading.tsx (settings home, categories, types, themes).
// Doesn't try to match any one page exactly — a page-title bar plus a
// couple of card-shaped blocks reads fine as a placeholder everywhere.
export default function Loading() {
  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <Skeleton width="200px" height="28px" style={{ marginBottom: 'var(--spacing-lg)' }} />

      <div className="skeleton-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Skeleton width="140px" height="16px" />
        <Skeleton height="36px" />
        <Skeleton height="36px" />
        <Skeleton height="36px" />
      </div>

      <div className="skeleton-card">
        <Skeleton width="140px" height="16px" />
        <Skeleton height="36px" />
        <Skeleton height="36px" />
      </div>
    </div>
  );
}
