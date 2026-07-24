// components/storefront/StorefrontHeader.tsx
'use client';

import Link from 'next/link';
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useFilterDrawer } from './FilterDrawerContext';

export function StorefrontHeader() {
  const t = useTranslations('storefront');
  const { open } = useFilterDrawer();

  return (
    <header className="storefront-header">
      {/* Mobile-only: opens the filter drawer. Hidden on desktop, where the
          filter sidebar is already visible alongside the content. */}
      <button
        type="button"
        className="storefront-header-menu-btn"
        aria-label={t('filters')}
        onClick={open}
      >
        <Bars3Icon style={{ width: '22px', height: '22px' }} />
      </button>

      <div className="storefront-header-logo-wrap">
        <img
          src="/itemlogs-full-transparent.png"
          alt="Itemlogs"
          style={{ height: '32px', width: 'auto', flexShrink: 0 }}
        />
      </div>

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
