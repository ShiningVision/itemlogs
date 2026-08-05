// components/storefront/PackageFilterDropdown.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';

type PackageOption = { id: number; name: string };

// A classic site-nav dropdown, not a form control: the trigger always shows
// the label itself (e.g. "Packages"), never the current selection, and
// opens a flyout listing every package with a hover highlight per row —
// picking one applies the filter and closes the menu. Opens on hover for
// desktop pointer users and on click/tap so it also works on touch and via
// keyboard.
export function PackageFilterDropdown({
  packages,
  selectedPackageId,
  label,
}: {
  packages: PackageOption[];
  selectedPackageId: number | null;
  label: string;
}) {
  const t = useTranslations('storefront');
  const { setParams } = useFilterParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openNow() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
  }

  // Small delay before closing on mouse-leave so moving from the trigger
  // down into the panel (there's a hairline gap between them) doesn't
  // dismiss the menu before the pointer arrives.
  function closeSoon() {
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  }

  function choose(value: string) {
    // Selecting a package resets the other filters — the visitor lands on
    // that package's items first, then can reapply category/type/status
    // filters on top of it.
    setParams({
      package: value || null,
      categories: null,
      types: null,
      statuses: null,
    });
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="storefront-package-nav"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        className="storefront-package-nav-trigger"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        {label}
        <ChevronDownIcon className="storefront-package-nav-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div role="menu" className="storefront-package-nav-menu">
          <button
            type="button"
            role="menuitem"
            className={`storefront-package-nav-item${selectedPackageId === null ? ' storefront-package-nav-item--active' : ''}`}
            onClick={() => choose('')}
          >
            {t('allLabel', { label })}
          </button>
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              role="menuitem"
              className={`storefront-package-nav-item${selectedPackageId === pkg.id ? ' storefront-package-nav-item--active' : ''}`}
              onClick={() => choose(String(pkg.id))}
            >
              {pkg.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
