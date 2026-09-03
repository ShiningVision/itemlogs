// components/storefront/TelegramIcon.tsx
// A simplified, hand-drawn approximation of the Telegram glyph (paper
// plane) in the brand blue — same reasoning as WhatsAppIcon.tsx: not a
// reproduction of any third-party icon library's exact artwork or
// Telegram's own official badge asset, just a small inline icon used next
// to itemlogs' own button styling.
export function TelegramIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <circle cx="16" cy="16" r="16" fill="#26A5E4" />
      <path
        d="M7 15.8 23.5 9.3c.8-.3 1.5.2 1.2 1.4l-2.6 12.3c-.2.9-.7 1.1-1.4.7l-3.9-2.9-1.9 1.8c-.2.2-.4.4-.8.4l.3-4 7.3-6.6c.3-.3-.1-.4-.5-.2l-9 5.7-3.9-1.2c-.8-.3-.8-.8.2-1.2z"
        fill="#fff"
      />
    </svg>
  );
}
