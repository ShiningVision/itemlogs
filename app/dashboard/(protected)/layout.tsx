// app/dashboard/(protected)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Sidebar } from '@/components/navigation/Sidebar';
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
  // showing (settings.use_sell_price defaults on once settings do exist)
  // and no visitor-page link (nothing live to link to yet).
  let showSales = true;
  let showVisitorPage = false;
  let visitorPageUrl: string | null = null;
  try {
    const settings = await getSettings();
    showSales = settings.use_sell_price;
    showVisitorPage = settings.show;
    visitorPageUrl = settings.app_url;
  } catch {
    // ignore — see comment above
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Sidebar showSales={showSales} showVisitorPage={showVisitorPage} visitorPageUrl={visitorPageUrl} showLogo />
      </aside>
      <div className="app-main">
        <AppHeader showSales={showSales} showVisitorPage={showVisitorPage} visitorPageUrl={visitorPageUrl} />
        <div>{children}</div>
      </div>
    </div>
  );
}
