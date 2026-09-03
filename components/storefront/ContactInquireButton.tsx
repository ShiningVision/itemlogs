// components/storefront/ContactInquireButton.tsx
// Replaces the old per-channel WhatsAppInquireButton now that there's more
// than one channel (Telegram, Email, Instagram) — every channel button is
// the same shape (icon + label, brand-colored, opens in a new tab/app),
// so this is the one component instead of a near-duplicate file per
// channel. Callers build the href themselves (buildWhatsAppLink,
// buildTelegramLink, buildEmailLink, buildInstagramLink — each already
// returns null when the tenant hasn't filled that channel in) and pass
// null straight through; this renders nothing in that case, same as the
// old component did.
export function ContactInquireButton({
  href,
  icon,
  label,
  brandColor,
}: {
  href: string | null;
  icon: React.ReactNode;
  label: string;
  brandColor: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="storefront-contact-button"
      style={{ '--contact-button-color': brandColor } as React.CSSProperties}
    >
      {icon}
      {label}
    </a>
  );
}
