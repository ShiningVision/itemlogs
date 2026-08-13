// app/dashboard/(protected)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/navigation/AppHeader';
import { getSettings } from '@/app/lib/services/settings';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Settings aren't available pre-setup (fresh tenant, no schema yet) —
  // the nav should still render in that case, just with the Sales link
  // showing (settings.use_sell_price defaults on once settings do exist).
  let showSales = true;
  try {
    const settings = await getSettings();
    showSales = settings.use_sell_price;
  } catch {
    // ignore — see comment above
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppHeader showSales={showSales} />
      <div>{children}</div>
    </div>
  );
}
