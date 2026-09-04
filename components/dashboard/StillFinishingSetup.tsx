// components/dashboard/StillFinishingSetup.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Rendered by app/dashboard/(protected)/page.tsx instead of crashing when
// getSettings()/getFeaturedItems()/getPackagesForVisibility() fail with an
// isUnprovisionedTenantError right after /setup — SetupForm.tsx's own
// client-side wait (waitUntilReady) already tries hard to not send a
// tenant here before PostgREST has caught up, but it's bounded, and even
// once it succeeds a *later* request can still land on a different,
// still-cold replica (see that comment for the full story). So this is the
// last line of defense: instead of an uncaught error crashing to Next's
// generic error boundary (a blank/white screen with no explanation), show
// the same "almost there" messaging the setup wizard itself uses, and keep
// retrying automatically.
export function StillFinishingSetup({ title, hint }: { title: string; hint: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.refresh(), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-md)',
      }}
    >
      <div className="setup-wizard-card setup-wizard-finishing" style={{ maxWidth: '420px' }}>
        <div className="setup-wizard-finishing-spinner" aria-hidden="true" />
        <h1 className="setup-wizard-title">{title}</h1>
        <p className="setup-wizard-hint">{hint}</p>
      </div>
    </div>
  );
}
