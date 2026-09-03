// app/dashboard/(protected)/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getFeaturedItems, FEATURED_ITEM_CAP } from '@/app/lib/services/items';
import { getPackagesForVisibility } from '@/app/lib/services/packages';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StorefrontLiveStatus } from '@/components/dashboard/StorefrontLiveStatus';
import { EarningsExpensesChart } from '@/components/dashboard/EarningsExpensesChart';
import { StorageDonutWidget } from '@/components/dashboard/StorageDonutWidget';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
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
  const [settings, featuredItems, visibilityPackages] = await Promise.all([
    getSettings(),
    getFeaturedItems(),
    getPackagesForVisibility(),
  ]);
  const t = await getTranslations('dashboard');

  // Shuffled per request (see force-dynamic above) so the ticker's line-up
  // order isn't identical on every visit.
  const flavourTexts = shuffle(t.raw('flavourTexts') as string[]);

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Wide control-panel shell — replaces the old 680px-capped
          settings-page-container, which forced this entire page (including
          the widgets below, which have nothing to do with the settings
          form) into a single narrow form-width column regardless of how
          much desktop screen was actually available. Only the settings
          form itself stays narrow-ish internally (see
          settings-storefront-group below); everything above it now uses
          the full width. */}
      <div className="dashboard-shell">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {t('title')}
        </h1>
        <FlavourTicker texts={flavourTexts} />

        <OnboardingChecklist settings={settings} />

        <DashboardStats />

        <div className="dashboard-grid">
          <div className="dashboard-grid-main">
            {/* Sell price is an opt-in feature (see settings.use_sell_price,
                the same switch that gates Sales nav/pages and item
                sell-mode controls) — an earnings-vs-expenses chart built on
                sell_price makes no sense for a tenant who doesn't track
                sell prices at all, so this follows the same gate rather
                than showing a chart that's always zero for them. */}
            {settings.use_sell_price && (
              <EarningsExpensesChart currencySymbol={settings.sell_currency?.currency_symbol ?? ''} />
            )}
            <RecentActivity />
          </div>

          <div className="dashboard-grid-rail">
            <StorefrontLiveStatus settings={settings} />
            <QuickActions appUrl={settings.app_url} />
            <StorageDonutWidget enabled={settings.show_dashboard_storage_widget} />
          </div>
        </div>

        <div className="settings-storefront-group">
          <div className="settings-storefront-wrapper">
            <h2 className="settings-storefront-heading">{t('storefrontSettingsHeading')}</h2>
            <SettingsForm
              settings={settings}
              featuredItems={featuredItems}
              featuredItemCap={FEATURED_ITEM_CAP}
              visibilityPackages={visibilityPackages}
            />
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
