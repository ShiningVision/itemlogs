// app/lib/whatsapp.ts
// Builds a WhatsApp "click to chat" link (https://wa.me/<number>?text=...) —
// WhatsApp/Meta's own officially-supported, no-API-key-needed mechanism for
// a "message us on WhatsApp" button. Opens the visitor's own WhatsApp (app
// on mobile, WhatsApp Web/Desktop otherwise) with the message pre-filled
// but NOT sent — the visitor still has to hit send themselves, so nothing
// about them is revealed to the tenant until they choose to.
//
// The phone number has to be digits-only with the country code and no
// leading 0/+/punctuation, or WhatsApp shows the visitor an error page
// ("Phone number shared via URL is invalid") instead of opening a chat.
// settings.contact_whatsapp is stored as the tenant typed it (spaces,
// dashes, a leading + — whatever's readable when they come back to edit
// it), so this strips everything down to digits right before building the
// link rather than at rest.
export function buildWhatsAppLink(rawPhone: string | null | undefined, message: string): string | null {
  const digits = (rawPhone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
