// app/dashboard/(protected)/settings/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getLanguages } from '@/app/lib/services/languages';
import { getUserByEmail } from '@/app/lib/services/users';
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm';
import { AccountSecurityForm } from '@/components/settings/AccountSecurityForm';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const [settings, currencies, languages, user] = await Promise.all([
    getSettings(),
    getCurrencies(),
    getLanguages(),
    getUserByEmail(session.user.email),
  ]);
  const t = await getTranslations('generalSettings');

  const username = user?.username ?? session.user.email.split('@')[0];

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div className="settings-page-container">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
          {t('title')}
        </h1>
        <GeneralSettingsForm settings={settings} currencies={currencies} languages={languages} />

        {user && (
          <AccountSecurityForm
            email={user.email}
            url={`${username}.itemlogs.app`}
          />
        )}
      </div>
    </div>
  );
}
