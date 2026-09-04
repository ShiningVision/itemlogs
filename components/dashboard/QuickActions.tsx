// components/dashboard/QuickActions.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CopyStorefrontLinkButton } from './CopyStorefrontLinkButton';
import { QuickSellButton } from '@/components/sales/QuickSellButton';

export async function QuickActions({ appUrl, showQuickSell }: { appUrl: string | null; showQuickSell: boolean }) {
  const t = await getTranslations('dashboard');

  return (
    <div className="dashboard-card dashboard-quick-actions">
      <h2 className="dashboard-card-title">{t('quickActionsTitle')}</h2>
      <div className="dashboard-quick-actions-list">
        <Link href="/dashboard/items/new" className="dashboard-quick-action-btn">
          <PlusIcon aria-hidden="true" />
          {t('quickActionAddItem')}
        </Link>
        <Link href="/dashboard/packages/new" className="dashboard-quick-action-btn">
          <PlusIcon aria-hidden="true" />
          {t('quickActionAddPackage')}
        </Link>
        {/* Sales/sell-price is an opt-in feature (same gate as the revenue
            chart — see settings.use_sell_price) — a shortcut into selling
            makes no sense for a tenant who doesn't track sell prices at all. */}
        {showQuickSell && <QuickSellButton variant="pill" />}
        {appUrl && <CopyStorefrontLinkButton url={appUrl} />}
      </div>
    </div>
  );
}
