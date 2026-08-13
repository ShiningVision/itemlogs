// app/dashboard/(protected)/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StorefrontLiveStatus } from '@/components/dashboard/StorefrontLiveStatus';
import { FlavourTicker } from '@/components/dashboard/FlavourTicker';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Flavour text is randomized per request, so this page must never be
// statically cached.
export const dynamic = 'force-dynamic';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function DashboardPage() {
  const settings = await getSettings();
  const t = await getTranslations('dashboard');

  // Shuffled per request (see force-dynamic above) so the ticker's line-up
  // order isn't identical on every visit.
  const flavourTexts = shuffle(t.raw('flavourTexts') as string[]);

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div className="settings-page-container">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {t('title')}
        </h1>
        <FlavourTicker texts={flavourTexts} />

        <OnboardingChecklist settings={settings} />

        <div className="dashboard-widgets-row">
          <DashboardStats />
          <StorefrontLiveStatus settings={settings} />
        </div>

        <div className="settings-storefront-group">
          <div className="settings-storefront-wrapper">
            <h2 className="settings-storefront-heading">{t('storefrontSettingsHeading')}</h2>
            <SettingsForm settings={settings} />
          </div>

          <div className="theme-portal-wrap">
            <Link href="/dashboard/themes" className="theme-portal-btn">
              <span className="theme-portal-btn-icon" aria-hidden="true">✨</span>
              <span className="theme-portal-btn-text">{t('changeThemesButton')}</span>
              <span className="theme-portal-btn-icon" aria-hidden="true">✨</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
