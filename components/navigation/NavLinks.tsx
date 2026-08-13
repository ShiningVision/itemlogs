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
  showSales = true,
}: {
  variant?: 'vertical' | 'horizontal';
  onNavigate?: () => void;
  showSales?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  // The Sales section only makes sense when sell prices are in use — see
  // the matching server-side redirect on the sales pages themselves,
  // which is the real gate; hiding the link here is just so the nav
  // doesn't point at a page that'll immediately bounce you back.
  const links = showSales ? LINKS : LINKS.filter((link) => link.key !== 'sales');

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
      {links.map(({ key, href, icon: Icon, exact }) => {
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
