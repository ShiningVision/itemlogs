// components/navigation/AppHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Sidebar } from './Sidebar';

// Mobile-only now — desktop (>860px, the same breakpoint this app already
// used to switch between horizontal-header and hamburger-drawer nav) gets a
// persistent left sidebar instead (see app/dashboard/(protected)/layout.tsx
// and .app-sidebar in globals.css), so there's no more horizontal nav or
// header-level logout button to show at that width. This component is
// hidden entirely above that breakpoint via .app-mobile-header in
// globals.css, rather than switching what it renders internally the way it
// used to.
export function AppHeader({
  showSales = true,
  showVisitorPage = false,
  visitorPageUrl = null,
}: {
  showSales?: boolean;
  showVisitorPage?: boolean;
  visitorPageUrl?: string | null;
}) {
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
        className="app-mobile-header"
        style={{
          // display deliberately left out here — .app-mobile-header in
          // globals.css owns it (flex on mobile, none from 861px up), since
          // an inline style's display would always beat that media query.
          position: 'sticky',
          top: 0,
          zIndex: 40,
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          background: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t('openMenu')}
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
          <Bars3Icon style={{ width: '24px', height: '24px' }} />
        </button>

        <img
          src="/itemlogs-full-transparent.png"
          alt="Itemlogs"
          style={{ height: '28px', width: 'auto', flexShrink: 0 }}
        />
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
              <Sidebar
                onNavigate={() => setDrawerOpen(false)}
                showSales={showSales}
                showVisitorPage={showVisitorPage}
                visitorPageUrl={visitorPageUrl}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
