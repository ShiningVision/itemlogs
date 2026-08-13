// components/navigation/AppHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { NavLinks } from './NavLinks';
import { Sidebar } from './Sidebar';

export function AppHeader({ showSales = true }: { showSales?: boolean }) {
  const t = useTranslations('nav');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          background: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button
            type="button"
            className="app-header-mobile-trigger"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('openMenu')}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text)',
              cursor: 'pointer',
              padding: 'var(--spacing-xs)',
            }}
          >
            <Bars3Icon style={{ width: '24px', height: '24px' }} />
          </button>

          <img
            src="/itemlogs-full-transparent.png"
            alt="Itemlogs"
            style={{ height: '28px', width: 'auto', flexShrink: 0 }}
          />
        </div>

        <div className="app-header-nav-links" style={{ gap: 'var(--spacing-xs)' }}>
          <NavLinks variant="horizontal" showSales={showSales} />
        </div>

        <button
          type="button"
          className="app-header-nav-links"
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
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
      </header>

      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '260px',
              maxWidth: '80vw',
              background: 'var(--color-background)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--spacing-sm)' }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t('closeMenu')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  padding: 'var(--spacing-xs)',
                }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Sidebar onNavigate={() => setDrawerOpen(false)} showSales={showSales} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
