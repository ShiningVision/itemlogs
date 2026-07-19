// components/storefront/ContactModal.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export function ContactModal({ contactInfo, itemName }: { contactInfo: string; itemName: string }) {
  const t = useTranslations('storefront');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isEmail = contactInfo.includes('@') && !contactInfo.includes(' ');
  const mailtoHref = isEmail
    ? `mailto:${contactInfo}?subject=${encodeURIComponent(`Inquiry about ${itemName}`)}`
    : null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contactInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — the text
      // is still visible in the modal for the visitor to select manually.
    }
  }

  return (
    <>
      <button type="button" className="storefront-contact-button" onClick={() => setOpen(true)}>
        <ChatBubbleLeftRightIcon style={{ width: '16px', height: '16px' }} />
        {t('inquire')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '360px', width: '90%' }}
          >
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-sm)' }}>
              {t('contactModalTitle', { item: itemName })}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>{t('contactModalBody')}</p>

            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-sm)',
              }}
            >
              <span style={{ wordBreak: 'break-all' }}>{contactInfo}</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {copied ? t('copied') : t('copyContact')}
              </button>
            </div>

            {mailtoHref && (
              <a
                href={mailtoHref}
                className="storefront-contact-button"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--spacing-sm)', textDecoration: 'none' }}
              >
                {t('inquire')}
              </a>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ width: '100%', textAlign: 'center', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm)', cursor: 'pointer', color: 'var(--color-text)' }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
