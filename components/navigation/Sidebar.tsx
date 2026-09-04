// components/navigation/Sidebar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { NavLinks } from './NavLinks';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export function Sidebar({
  onNavigate,
  showSales = true,
  showVisitorPage = false,
  visitorPageUrl = null,
  showLogo = false,
}: {
  onNavigate?: () => void;
  showSales?: boolean;
  showVisitorPage?: boolean;
  visitorPageUrl?: string | null;
  // The persistent desktop sidebar (see app/dashboard/(protected)/layout.tsx)
  // is the only place the logo needs to live now that the top header is
  // mobile-only — the mobile drawer already gets its logo from AppHeader's
  // own header bar above it, so rendering it a second time in here too
  // would be redundant there.
  showLogo?: boolean;
} = {}) {
  const t = useTranslations('nav');

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: 'var(--spacing-lg) var(--spacing-md)',
        background: 'var(--color-background)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {showLogo && (
          <img
            src="/itemlogs-full-transparent.png"
            alt="Itemlogs"
            // This <img> is a flex item inside a flexDirection:'column'
            // container (the div wrapping it), whose cross axis is
            // horizontal — align-items defaults to 'stretch', which
            // stretches a flex item to fill the container's width unless
            // it opts out. width:'auto' alone doesn't opt out (stretch
            // computes an explicit used width even then), which is what
            // was distorting the logo into a squashed, stretched banner.
            // alignSelf:'flex-start' is the actual opt-out.
            style={{ height: '28px', width: 'auto', alignSelf: 'flex-start', margin: '0 0 var(--spacing-lg) var(--spacing-md)' }}
          />
        )}
        <NavLinks
          onNavigate={onNavigate}
          showSales={showSales}
          showVisitorPage={showVisitorPage}
          visitorPageUrl={visitorPageUrl}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: '/' });
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-base)',
        }}
      >
        <ArrowRightStartOnRectangleIcon style={{ width: '22px', height: '22px' }} />
        <span>{t('logout')}</span>
      </button>
    </nav>
  );
}