'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LinkIcon, CheckIcon } from '@heroicons/react/24/outline';

// The one genuinely "share your storefront" action on the dashboard —
// deliberately not a checklist step (see OnboardingChecklist.tsx's header
// comment): there's no meaningful "done" state for sharing a link, it's
// just something to do again whenever.
export function CopyStorefrontLinkButton({ url }: { url: string }) {
  const t = useTranslations('dashboard');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context)
      // — nothing useful to do beyond just not showing the "Copied" state.
    }
  }

  return (
    <button type="button" className="dashboard-quick-action-btn" onClick={handleCopy}>
      {copied ? <CheckIcon aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}
      {copied ? t('quickActionLinkCopied') : t('quickActionCopyLink')}
    </button>
  );
}
