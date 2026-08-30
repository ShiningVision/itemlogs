// app/setup/page.tsx
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/lib/services/settings';
import { SetupForm } from '@/components/auth/SetupForm';
import { isUnprovisionedTenantError } from '@/app/lib/errors/isUnprovisionedTenantError';
import { ServiceUnavailable } from '@/components/ui/ServiceUnavailable';

export default async function SetupPage() {
  // If settings already exist, this tenant is already configured — send
  // them to the real app instead of letting them re-run setup. redirect()
  // has to happen outside the try/catch: it works by throwing internally,
  // and a catch wrapped around it here would just swallow that throw.
  //
  // A getSettings() failure isn't automatically "not configured yet"
  // though — it's also what a genuinely broken backend looks like (see the
  // isUnprovisionedTenantError comment for the Supabase-project-got-banned
  // scenario this was built for). Showing the setup wizard in that case is
  // actively misleading: it looks like a normal first run, and resubmitting
  // it just fails again against the same broken backend with a cryptic raw
  // error and no real explanation.
  let alreadyConfigured = true;
  let unreachable = false;
  try {
    await getSettings();
  } catch (error) {
    if (isUnprovisionedTenantError(error)) {
      alreadyConfigured = false;
    } else {
      unreachable = true;
    }
  }
  if (alreadyConfigured) {
    redirect('/');
  }

  if (unreachable) {
    const t = await getTranslations('serviceUnavailable');
    return <ServiceUnavailable title={t('title')} message={t('message')} />;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        padding: 'var(--spacing-md)',
      }}
    >
      <SetupForm />
    </main>
  );
}
