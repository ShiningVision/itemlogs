// components/storefront/PackageFilterDropdown.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';

type PackageOption = { id: number; name: string };

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

  function handleChange(value: string) {
    // Selecting a package resets the other filters — the visitor lands on
    // that package's items first, then can reapply category/type/status
    // filters on top of it.
    setParams({
      package: value || null,
      categories: null,
      types: null,
      statuses: null,
    });
  }

  return (
    <select
      aria-label={label}
      value={selectedPackageId ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      className="storefront-package-filter-select"
    >
      <option value="">{t('allLabel', { label })}</option>
      {packages.map((pkg) => (
        <option key={pkg.id} value={pkg.id}>
          {pkg.name}
        </option>
      ))}
    </select>
  );
}
