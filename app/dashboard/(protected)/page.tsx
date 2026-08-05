// app/dashboard/(protected)/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StorefrontLiveStatus } from '@/components/dashboard/StorefrontLiveStatus';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Flavour text is randomized per request, so this page must never be
// statically cached.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const settings = await getSettings();
  const t = await getTranslations('dashboard');

  const flavourTexts = t.raw('flavourTexts') as string[];
  const flavourText = flavourTexts[Math.floor(Math.random() * flavourTexts.length)];

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div className="settings-page-container">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {t('title')}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-casual), cursive',
            fontStyle: 'italic',
            color: 'var(--color-primary)',
            fontSize: 'var(--font-size-xxl, 1.9rem)',
            lineHeight: 1.4,
            textAlign: 'center',
            marginTop: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
          }}
        >
          {flavourText}
        </p>

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
