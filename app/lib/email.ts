// app/lib/email.ts
// Builds a mailto: link with the subject/body pre-filled — no external
// service, API key, or deep-link scheme needed, mailto is a universal
// browser/OS feature. Same "pre-filled but not sent" property as the
// WhatsApp/Telegram links: opens the visitor's own mail client with a
// draft, they still have to hit send themselves.
export function buildEmailLink(rawAddress: string | null | undefined, subject: string, body: string): string | null {
  const address = (rawAddress ?? '').trim();
  if (!address) return null;
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
