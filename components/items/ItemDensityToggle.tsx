// components/items/ItemDensityToggle.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { Squares2X2Icon, ViewColumnsIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export type ItemDensity = 'dense' | 'showcase' | 'compact';

// Dense/showcase toggle mirrors the storefront's DensityToggle
// (components/storefront/DensityToggle.tsx), duplicated rather than shared
// because it reads labels from the 'items' translation namespace instead
// of 'storefront' — the dashboard items page and the public storefront
// page are separate next-intl namespaces. 'compact' is dashboard-only
// (not offered on the storefront) — a third, denser-still option mainly
// meant for browsing the items list on a phone: 3 items per row and a
// shorter image area instead of dense's square thumbnails.
export function ItemDensityToggle({ density }: { density: ItemDensity }) {
  const t = useTranslations('items');
  const { setParam } = useFilterParams();

  return (
    <div className="density-toggle-group">
      <button
        type="button"
        className={`density-toggle-button${density === 'dense' ? ' density-toggle-button--active' : ''}`}
        onClick={() => setParam('density', 'dense')}
      >
        <Squares2X2Icon style={{ width: '14px', height: '14px' }} />
        {t('densityDense')}
      </button>
      <button
        type="button"
        className={`density-toggle-button${density === 'showcase' ? ' density-toggle-button--active' : ''}`}
        onClick={() => setParam('density', 'showcase')}
      >
        <ViewColumnsIcon style={{ width: '14px', height: '14px' }} />
        {t('densityShowcase')}
      </button>
      <button
        type="button"
        className={`density-toggle-button${density === 'compact' ? ' density-toggle-button--active' : ''}`}
        onClick={() => setParam('density', 'compact')}
      >
        <TableCellsIcon style={{ width: '14px', height: '14px' }} />
        {t('densityCompact')}
      </button>
    </div>
  );
}
