// components/storefront/BackToStorefrontButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';

// A plain <Link href="/"> would always load a fresh storefront root and
// reset scroll to the top. router.back() instead returns to the actual
// grid page (with whatever filters/page it had) and restores its scroll
// position, same as pressing the browser's native back button.
//
// Fixed to the bottom-right corner rather than the top-left: on mobile
// that's a thumb-reachable spot, instead of a target you have to stretch
// up to the top of the screen for.
export function BackToStorefrontButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <Tooltip text={label}>
      <button
        type="button"
        onClick={() => router.back()}
        className="storefront-back-button"
        aria-label={label}
      >
        <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
        <span className="storefront-back-button-label">{label}</span>
      </button>
    </Tooltip>
  );
}
