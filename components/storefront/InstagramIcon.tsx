// components/storefront/InstagramIcon.tsx
// A simplified, hand-drawn approximation of the Instagram glyph (camera
// outline) — same reasoning as WhatsAppIcon.tsx/TelegramIcon.tsx: a small
// inline icon, not a reproduction of Instagram's own official badge asset.
// Flat brand pink rather than the real multi-stop gradient badge — this can
// render more than once on a page (settings label + storefront button), and
// an inline SVG <linearGradient> needs a unique id per instance to be safe
// across concurrent server-rendered requests, which isn't worth the
// complexity for a small inline icon like this.
export function InstagramIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <circle cx="16" cy="16" r="16" fill="#D6249F" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="20.2" cy="11.8" r="1" fill="#fff" />
    </svg>
  );
}
