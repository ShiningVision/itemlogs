// app/dashboard/(protected)/themes/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { THEME_DISPLAY_CATALOG } from '@/app/lib/themeCatalog';
import { fetchThemeStatuses, buyThemeUrl } from '@/app/lib/central-site';
import { ThemesGrid } from '@/components/settings/ThemesGrid';
import { getTranslations } from 'next-intl/server';

// Trial expiry (and central purchase status) need to be checked fresh on
// every visit.
export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const settings = await getSettings();
  const t = await getTranslations('themes');

  const currentTheme = settings.theme ?? 'default';
  const centralStatuses = settings.app_url ? await fetchThemeStatuses(settings.app_url) : null;
  const couldNotVerify = settings.app_url != null && centralStatuses === null;

  const themeStates = THEME_DISPLAY_CATALOG.map((entry) => {
    if (entry.name === 'default') {
      return {
        name: entry.name,
        labelKey: entry.labelKey,
        priceCents: 0,
        owned: true,
        tried: true,
        current: currentTheme === entry.name,
        buyUrl: null,
      };
    }

    const remote = centralStatuses?.find((s) => s.slug === entry.name);
    return {
      name: entry.name,
      labelKey: entry.labelKey,
      priceCents: remote?.priceCents ?? 0,
      // Couldn't reach the central site — fail closed (nothing owned/tried)
      // rather than trusting anything local.
      owned: remote?.purchased ?? false,
      tried: remote?.tried ?? false,
      current: currentTheme === entry.name,
      buyUrl: settings.app_url ? buyThemeUrl(settings.app_url, entry.name) : null,
    };
  });

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

        {couldNotVerify && (
          <p
            style={{
              color: 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            {t('couldNotVerify')}
          </p>
        )}

        <ThemesGrid
          themes={themeStates}
          trialActiveTheme={trialActiveTheme}
          trialExpiresAt={trialExpiresAt}
        />
      </div>
    </div>
  );
}
