// app/setup/page.tsx
import { redirect } from 'next/navigation';
import { getSettings } from '@/app/lib/services/settings';
import { SetupForm } from '@/components/auth/SetupForm';

export default async function SetupPage() {
  // If settings already exist, this tenant is already configured — send
  // them to the real app instead of letting them re-run setup. redirect()
  // has to happen outside the try/catch: it works by throwing internally,
  // and a catch wrapped around it here would just swallow that throw.
  let alreadyConfigured = true;
  try {
    await getSettings();
  } catch {
    alreadyConfigured = false;
  }
  if (alreadyConfigured) {
    redirect('/');
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
