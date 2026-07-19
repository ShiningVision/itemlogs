// components/storefront/StorefrontHeader.tsx
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export function StorefrontHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-background)',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', flexShrink: 0 }}
        aria-label="Logo placeholder"
      />

      <Link
        href="/login"
        aria-label="Login"
        className="interactive-card"
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