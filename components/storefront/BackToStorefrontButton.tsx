// components/storefront/BackToStorefrontButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// A plain <Link href="/"> would always load a fresh storefront root and
// reset scroll to the top. router.back() instead returns to the actual
// grid page (with whatever filters/page it had) and restores its scroll
// position, same as pressing the browser's native back button.
export function BackToStorefrontButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="interactive-card"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        marginBottom: 'var(--spacing-md)',
        background: 'transparent',
        border: 'none',
        padding: 0,
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
      }}
    >
      <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
      {label}
    </button>
  );
}
