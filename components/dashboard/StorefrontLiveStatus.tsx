// components/dashboard/StorefrontLiveStatus.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Settings } from '@/app/lib/definitions';

export async function StorefrontLiveStatus({ settings }: { settings: Settings }) {
  const t = await getTranslations('dashboard');
  const isLive = Boolean(settings.show);

  return (
    <div className="dashboard-card dashboard-live-status">
      <div className="dashboard-live-status-header">
        <span
          className={`dashboard-live-dot ${isLive ? 'dashboard-live-dot-on' : 'dashboard-live-dot-off'}`}
          aria-hidden="true"
        />
        <h2 className="dashboard-card-title">{isLive ? t('liveStatusLive') : t('liveStatusOffline')}</h2>
      </div>
      {isLive && settings.app_url ? (
        <Link href="/" className="dashboard-live-status-link">
          {t('liveStatusViewButton')}
        </Link>
      ) : (
        <p className="dashboard-live-status-hint">{t('liveStatusHint')}</p>
      )}
    </div>
  );
}
