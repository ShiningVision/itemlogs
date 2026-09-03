// app/lib/telegram.ts
// Builds a Telegram "click to chat" link (https://t.me/<username>?text=...)
// — Telegram's own officially-supported deep link for opening a chat with a
// specific username, message pre-filled but not sent. Same "visitor still
// has to hit send" privacy property as WhatsApp (see app/lib/whatsapp.ts),
// same reasoning for building the link fresh here rather than at rest:
// settings.contact_telegram is stored exactly as the tenant typed it
// (optionally with a leading @), so that gets stripped off right before
// building the link, not when saved.
export function buildTelegramLink(rawUsername: string | null | undefined, message: string): string | null {
  const username = (rawUsername ?? '').trim().replace(/^@/, '');
  if (!username) return null;
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}
