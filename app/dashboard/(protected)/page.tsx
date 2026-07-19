// app/dashboard/(protected)/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
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
        <div className="settings-storefront-group">
          <SettingsForm settings={settings} />

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
