// components/storefront/WhatsAppIcon.tsx
// A simplified, hand-drawn approximation of the WhatsApp glyph (speech
// bubble + handset) in the brand green — not a reproduction of any
// third-party icon library's exact artwork (Heroicons doesn't ship brand
// logos at all), and not Meta's own official badge asset either, since
// that isn't something this codebase can fetch/redistribute with a known
// license. Meta's brand guidelines for third-party "Chat on WhatsApp"
// buttons ask that the icon not be combined with other logos and not
// outshine the host site's own branding — this stays a small inline icon
// used exactly that way, next to itemlogs' own button styling, not a
// standalone badge.
export function WhatsAppIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        d="M23.4 8.6a10 10 0 0 0-15.8 12L6 26l5.6-1.5a10 10 0 0 0 4.8 1.2h0a10 10 0 0 0 7-17.1zm-7 15.3h0a8.3 8.3 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.3 8.3 0 1 1 15.4-4.4 8.3 8.3 0 0 1-8.4 8.3zm4.5-6.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.2.2-.3.2-.5.1a6.8 6.8 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4a15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1c.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"
        fill="#fff"
      />
    </svg>
  );
}
