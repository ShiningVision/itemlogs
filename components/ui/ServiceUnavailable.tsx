// components/ui/ServiceUnavailable.tsx
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Shown instead of the storefront (app/page.tsx) or the setup wizard
// (app/setup/page.tsx) when getSettings() fails for a reason other than
// "this tenant hasn't run setup yet" — see isUnprovisionedTenantError for
// why that distinction matters. Deliberately plain: this can render while
// the database itself is unreachable, so it can't depend on anything that
// needs a DB round-trip (it only takes already-resolved translated strings
// as props, same as everything else on these two pages at this point).
export function ServiceUnavailable({ title, message }: { title: string; message: string }) {
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
      <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="confirm-dialog-icon">
          <ExclamationTriangleIcon style={{ width: '26px', height: '26px' }} />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--spacing-sm)' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{message}</p>
      </div>
    </main>
  );
}
