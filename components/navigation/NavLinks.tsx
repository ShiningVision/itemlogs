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
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

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
  showVisitorPage = false,
  visitorPageUrl = null,
}: {
  variant?: 'vertical' | 'horizontal';
  onNavigate?: () => void;
  showSales?: boolean;
  // Same gate as the dashboard's storefront-live toggle (settings.show) —
  // no point linking to a visitor page that's currently turned off.
  showVisitorPage?: boolean;
  visitorPageUrl?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('nav');

  // Editing an item always lives at /dashboard/items/[id]/edit regardless
  // of where you opened it from (the items list, a package's item list, a
  // sale's item list) — so pathname-based highlighting alone would always
  // show "Items" active there, even when the back button on that page
  // actually returns to Packages or Sales. ItemCard appends ?section=... to
  // the edit link when it's rendered inside a package/sale context (see
  // ItemCard.tsx), and that overrides the highlight here so it matches
  // where "back" really goes.
  const sectionOverride = searchParams.get('section');

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
        // Vertical (sidebar) list gets more breathing room than the tight
        // horizontal variant — on the persistent desktop sidebar especially,
        // a handful of links in a full-height column otherwise left a big
        // block of empty space above the pinned logout button.
        gap: variant === 'horizontal' ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
        flexWrap: variant === 'horizontal' ? 'wrap' : 'nowrap',
      }}
    >
      {links.map(({ key, href, icon: Icon, exact }) => {
        const isActive = sectionOverride ? key === sectionOverride : exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: variant === 'horizontal' ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
              background: isActive ? 'var(--color-surface)' : 'transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon style={{ width: variant === 'horizontal' ? '20px' : '22px', height: variant === 'horizontal' ? '20px' : '22px' }} />
            <span>{t(key)}</span>
          </Link>
        );
      })}

      {showVisitorPage && visitorPageUrl && (
        <a
          href={visitorPageUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: variant === 'horizontal' ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--color-text)',
            background: 'transparent',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <ArrowTopRightOnSquareIcon
            style={{ width: variant === 'horizontal' ? '20px' : '22px', height: variant === 'horizontal' ? '20px' : '22px' }}
          />
          <span>{t('viewVisitorPage')}</span>
        </a>
      )}
    </div>
  );
}
