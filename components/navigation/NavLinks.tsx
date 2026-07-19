// components/navigation/NavLinks.tsx
'use client';

import { useTranslations } from 'next-intl';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  CubeIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  PhotoIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { key: 'dashboard', href: '/dashboard', icon: HomeIcon, exact: true },
  { key: 'items', href: '/dashboard/items', icon: DocumentDuplicateIcon },
  { key: 'packages', href: '/dashboard/packages', icon: CubeIcon },
  { key: 'sales', href: '/dashboard/sales', icon: ShoppingBagIcon },
  { key: 'gallery', href: '/dashboard/gallery', icon: PhotoIcon },
  { key: 'themes', href: '/dashboard/themes', icon: SwatchIcon },
  { key: 'settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function NavLinks({
  variant = 'vertical',
  onNavigate,
}: {
  variant?: 'vertical' | 'horizontal';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: variant === 'horizontal' ? 'row' : 'column',
        alignItems: variant === 'horizontal' ? 'center' : 'stretch',
        gap: variant === 'horizontal' ? 'var(--spacing-xs)' : 'var(--spacing-xs)',
        flexWrap: variant === 'horizontal' ? 'wrap' : 'nowrap',
      }}
    >
      {LINKS.map(({ key, href, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
              background: isActive ? 'var(--color-surface)' : 'transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon style={{ width: '20px', height: '20px' }} />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </div>
  );
}
