// components/ui/SortSelect.tsx
'use client';

import { useFilterParams } from '@/app/lib/hooks/useFilterParams';

// Shared "Sort by" dropdown for item grids — used on both the dashboard
// items page and the public storefront. Drives the `sort` URL param
// through the same useFilterParams hook every other filter control uses,
// so it plays nicely with pagination reset, category/type filters, etc.
// Takes its options as props (rather than looking up translations itself)
// so each page can supply labels from its own next-intl namespace.
export function SortSelect({
  value,
  options,
  label,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  label?: string;
}) {
  const { setParam } = useFilterParams();

  return (
    <label className="sort-select">
      {label && <span className="sort-select-label">{label}</span>}
      <select className="sheet-input" value={value} onChange={(e) => setParam('sort', e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
