// components/items/ItemDensityToggle.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';

// Same dense/showcase toggle as the storefront's DensityToggle
// (components/storefront/DensityToggle.tsx), duplicated rather than shared
// because it reads labels from the 'items' translation namespace instead
// of 'storefront' — the dashboard items page and the public storefront
// page are separate next-intl namespaces.
export function ItemDensityToggle({ density }: { density: 'dense' | 'showcase' }) {
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
    </div>
  );
}
