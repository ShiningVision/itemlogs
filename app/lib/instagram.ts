// app/lib/instagram.ts
// Builds an Instagram DM deep link (https://ig.me/m/<username>) — Meta's
// own officially-supported "message this account" link, same family as
// wa.me. Unlike WhatsApp/Telegram, this one has no message-prefill
// parameter: it just opens a blank DM thread with the account, so unlike
// buildWhatsAppLink/buildTelegramLink this doesn't take a message argument
// — there's nothing to do with one.
export function buildInstagramLink(rawUsername: string | null | undefined): string | null {
  const username = (rawUsername ?? '').trim().replace(/^@/, '');
  if (!username) return null;
  return `https://ig.me/m/${username}`;
}
