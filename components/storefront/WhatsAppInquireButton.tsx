// components/storefront/WhatsAppInquireButton.tsx
import { buildWhatsAppLink } from '@/app/lib/whatsapp';
import { WhatsAppIcon } from './WhatsAppIcon';

// Replaces the old ContactModal — that component existed to work around
// contact_info being free text of unknown shape (email vs. Discord handle
// vs. something else), needing a modal with a copy-to-clipboard fallback
// and a conditional mailto link. A WhatsApp number has exactly one thing
// to do with it (build a wa.me link), so this is just that link — no
// client-side state, no modal, no 'use client' even needed.
export function WhatsAppInquireButton({
  phone,
  message,
  label,
}: {
  phone: string | null | undefined;
  message: string;
  label: string;
}) {
  const href = buildWhatsAppLink(phone, message);
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="storefront-whatsapp-button">
      <WhatsAppIcon size={18} />
      {label}
    </a>
  );
}
