// components/storefront/DensityToggle.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFilterParams } from '@/app/lib/hooks/useFilterParams';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';

export function DensityToggle({ density }: { density: 'dense' | 'showcase' }) {
  const t = useTranslations('storefront');
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
