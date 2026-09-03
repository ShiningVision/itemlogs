// components/dashboard/QuickActions.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PlusIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { CopyStorefrontLinkButton } from './CopyStorefrontLinkButton';

export async function QuickActions({ appUrl }: { appUrl: string | null }) {
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
        <Link href="/" className="dashboard-quick-action-btn" target="_blank" rel="noreferrer">
          <ArrowTopRightOnSquareIcon aria-hidden="true" />
          {t('quickActionViewStorefront')}
        </Link>
        {appUrl && <CopyStorefrontLinkButton url={appUrl} />}
      </div>
    </div>
  );
}
