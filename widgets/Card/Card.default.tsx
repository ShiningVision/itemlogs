// widgets/Card/Card.default.tsx
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

export function Card({
  href,
  radius = 'md',
  interactive = false,
  padding = true,
  style,
  children,
}: {
  href?: string;
  radius?: 'md' | 'lg';
  interactive?: boolean;
  padding?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const chrome: CSSProperties = {
    display: 'block',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: radius === 'lg' ? 'var(--radius-lg)' : 'var(--radius-md)',
    overflow: 'hidden',
    ...(padding ? { padding: 'var(--spacing-md)' } : {}),
    ...style,
  };

  if (href) {
    return (
      <Link
        href={href}
        className={interactive ? 'interactive-card' : undefined}
        style={{ ...chrome, textDecoration: 'none', color: 'inherit' }}
      >
        {children}
      </Link>
    );
  }

  return <div style={chrome}>{children}</div>;
}
