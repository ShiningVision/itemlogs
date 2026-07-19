// components/ui/Pagination.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const t = await getTranslations('pagination');
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: 'var(--spacing-xs) var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-bold)',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
      <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={!hasPrev} style={buttonStyle(!hasPrev)}>
        {t('previous')}
      </Link>

      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        {t('pageOf', { page, total: totalPages })}
      </span>

      <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={!hasNext} style={buttonStyle(!hasNext)}>
        {t('next')}
      </Link>
    </div>
  );
}
