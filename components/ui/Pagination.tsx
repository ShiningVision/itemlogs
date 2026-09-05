// components/ui/Pagination.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PageJumpForm } from './PageJumpForm';

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

  const arrowButtonStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
      <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={!hasPrev} aria-label={t('previous')} style={arrowButtonStyle(!hasPrev)}>
        <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
      </Link>

      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        {t('page')}
        <PageJumpForm page={page} totalPages={totalPages} inputLabel={t('pageInputLabel')} />
        {t('of', { total: totalPages })}
      </span>

      <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={!hasNext} aria-label={t('next')} style={arrowButtonStyle(!hasNext)}>
        <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
      </Link>
    </div>
  );
}
