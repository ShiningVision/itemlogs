// app/dashboard/(protected)/themes/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { THEME_CATALOG } from '@/app/lib/themeCatalog';
import { ThemesGrid } from '@/components/settings/ThemesGrid';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

// Trial expiry needs to be checked fresh on every visit.
export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const settings = await getSettings();
  const t = await getTranslations('themes');

  const ownedThemes = settings.owned_themes ?? ['default', 'dark'];
  const triedThemes = settings.tried_themes ?? [];
  const currentTheme = settings.theme ?? 'default';

  const themeStates = THEME_CATALOG.map((entry) => ({
    ...entry,
    owned: entry.free || ownedThemes.includes(entry.name),
    tried: triedThemes.includes(entry.name),
    current: currentTheme === entry.name,
  }));

  // Used to build the "buy now" link back to the central store — it needs
  // to know which install/domain to activate the purchase for once payment
  // completes there.
  const hdrs = await headers();
  const host = hdrs.get('host') ?? '';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const returnUrl = host ? `${protocol}://${host}` : '';

  const trialActiveTheme =
    settings.theme_trial_expires_at && new Date(settings.theme_trial_expires_at).getTime() > Date.now()
      ? currentTheme
      : null;
  const trialExpiresAt = trialActiveTheme ? settings.theme_trial_expires_at : null;

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div className="settings-page-container">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)', marginBottom: 'var(--spacing-lg)' }}>
          {t('subtitle')}
        </p>

        <ThemesGrid
          themes={themeStates}
          returnUrl={returnUrl}
          trialActiveTheme={trialActiveTheme}
          trialExpiresAt={trialExpiresAt}
        />
      </div>
    </div>
  );
}
