// components/dashboard/StorefrontLiveToggle.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { updateStorefrontSettingFieldAction } from '@/app/lib/actions/settings';
import { Toggle } from '@/components/ui/Toggle';

// The "Show storefront" toggle used to live in the storefront settings form.
// It's moved here so the on/off switch and the live-status readout it
// affects sit in the same place. Local state mirrors the toggle immediately
// (rather than waiting on a server round-trip + revalidate) so the
// live/offline label and CTA below update the instant it's flipped.
export function StorefrontLiveToggle({ defaultChecked }: { defaultChecked: boolean }) {
  const t = useTranslations('dashboard');
  const [isLive, setIsLive] = useState(defaultChecked);
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setIsLive(checked);
    startTransition(async () => {
      await updateStorefrontSettingFieldAction('show', checked);
    });
  }

  return (
    <div>
      <div className="dashboard-live-status-header">
        <span
          className={`dashboard-live-dot ${isLive ? 'dashboard-live-dot-on' : 'dashboard-live-dot-off'}`}
          aria-hidden="true"
        />
        <h2 className="dashboard-card-title dashboard-live-status-title">
          {isLive ? t('liveStatusLive') : t('liveStatusOffline')}
        </h2>
        <Toggle name="show" defaultChecked={defaultChecked} label={t('show')} onChange={handleChange} />
      </div>
      {isLive ? (
        <Link href="/" className="dashboard-live-status-link">
          {t('liveStatusViewButton')}
        </Link>
      ) : (
        <p className="dashboard-live-status-hint">{t('liveStatusHint')}</p>
      )}
    </div>
  );
}
