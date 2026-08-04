// app/dashboard/(protected)/settings/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getLanguages } from '@/app/lib/services/languages';
import { getSharePasswords } from '@/app/lib/services/share-passwords';
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm';
import { AccountSecurityForm } from '@/components/settings/AccountSecurityForm';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const isOwner = session.user.role === 'owner';

  const [settings, currencies, languages, sharePasswords] = await Promise.all([
    getSettings(),
    getCurrencies(),
    getLanguages(),
    isOwner ? getSharePasswords() : Promise.resolve([]),
  ]);
  const t = await getTranslations('generalSettings');

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div className="settings-page-container">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
          {t('title')}
        </h1>
        <GeneralSettingsForm settings={settings} currencies={currencies} languages={languages} />

        <AccountSecurityForm
          url={settings.app_url ?? ''}
          isOwner={isOwner}
          sharePasswords={sharePasswords}
        />
      </div>
    </div>
  );
}
