// components/navigation/Sidebar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { NavLinks } from './NavLinks';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export function Sidebar({
  onNavigate,
  showSales = true,
}: {
  onNavigate?: () => void;
  showSales?: boolean;
} = {}) {
  const t = useTranslations('nav');

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--color-background)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        <NavLinks onNavigate={onNavigate} showSales={showSales} />
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
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-base)',
        }}
      >
        <ArrowRightStartOnRectangleIcon style={{ width: '20px', height: '20px' }} />
        <span>{t('logout')}</span>
      </button>
    </nav>
  );
}