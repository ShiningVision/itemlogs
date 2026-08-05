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
  const [saveError, setSaveError] = useState(false);
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setIsLive(checked);
    setSaveError(false);
    startTransition(async () => {
      try {
        const result = await updateStorefrontSettingFieldAction('show', checked);
        if (result && 'error' in result) throw new Error(result.error);
      } catch {
        // A failed save (e.g. a transient edge/network error, or hitting a
        // freshly-attached custom domain before it's fully verified) must
        // not leave the toggle showing "live" with a working-looking "View
        // storefront" link while the database still says otherwise — that
        // link would just bounce the tenant to /login. Roll the optimistic
        // state back to what it actually was before this click.
        setIsLive(!checked);
        setSaveError(true);
      }
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
        {/* Keyed on isLive so a programmatic revert (the catch block above)
            actually re-renders the underlying uncontrolled checkbox to
            match — defaultChecked alone only applies on mount. */}
        <Toggle key={String(isLive)} name="show" defaultChecked={isLive} label={t('show')} onChange={handleChange} />
      </div>
      {isLive ? (
        <Link href="/" className="dashboard-live-status-link">
          {t('liveStatusViewButton')}
        </Link>
      ) : (
        <p className="dashboard-live-status-hint">{t('liveStatusHint')}</p>
      )}
      {saveError && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
          {t('saveFailed')}
        </p>
      )}
    </div>
  );
}
