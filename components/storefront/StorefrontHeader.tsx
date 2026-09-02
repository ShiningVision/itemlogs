// components/storefront/StorefrontHeader.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useFilterDrawerOptional } from './FilterDrawerContext';

export function StorefrontHeader({
  packageFilter,
  // Item detail page (app/items/[id]/page.tsx — the visitor-facing single
  // item view, not the dashboard edit page): no filter sidebar/drawer
  // exists there (nothing on a single item to filter), so the hamburger
  // trigger has nowhere to open into — hide it rather than wire it up to a
  // no-op. logoLinksBack turns the logo into the same "back to the grid
  // page you came from" action as BackToStorefrontButton (router.back(),
  // not a plain link to "/", so filters/scroll position on the grid are
  // preserved) instead of sitting inert.
  hideMenuButton = false,
  logoLinksBack = false,
}: {
  packageFilter?: React.ReactNode;
  hideMenuButton?: boolean;
  logoLinksBack?: boolean;
}) {
  const t = useTranslations('storefront');
  const router = useRouter();
  // Optional/non-throwing: the item detail page renders this header with
  // hideMenuButton and no FilterDrawerProvider ancestor at all, so `drawer`
  // is null there — the button below is hidden in that case anyway, but
  // this keeps the hook call itself unconditional either way.
  const drawer = useFilterDrawerOptional();

  const logo = (
    <img
      src="/itemlogs-full-transparent.png"
      alt="Itemlogs"
      style={{ height: '32px', width: 'auto', flexShrink: 0 }}
    />
  );

  return (
    <header className="storefront-header">
      {/* Mobile-only: opens the filter drawer. Hidden on desktop, where the
          filter sidebar is already visible alongside the content. */}
      {!hideMenuButton && (
        <button
          type="button"
          className="storefront-header-menu-btn"
          aria-label={t('filters')}
          onClick={() => drawer?.open()}
        >
          <FunnelIcon style={{ width: '22px', height: '22px' }} />
        </button>
      )}

      <div className="storefront-header-logo-wrap">
        {logoLinksBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t('backToStorefront')}
            className="storefront-header-logo-btn"
          >
            {logo}
          </button>
        ) : (
          logo
        )}
      </div>

      {packageFilter && (
        <div className="storefront-header-package-filter">{packageFilter}</div>
      )}

      <Link
        href="/login"
        aria-label="Login"
        className="interactive-card storefront-header-login"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-text)',
        }}
      >
        <UserCircleIcon style={{ width: '28px', height: '28px' }} />
      </Link>
    </header>
  );
}
