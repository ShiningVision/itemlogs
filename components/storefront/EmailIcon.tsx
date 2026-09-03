// components/storefront/EmailIcon.tsx
// Same circle+glyph shape as WhatsAppIcon/TelegramIcon/InstagramIcon for a
// consistent row of contact buttons, but email isn't a single company's
// brand — there's no "email brand color" to match, so this uses a neutral
// slate instead of chasing a real one.
export function EmailIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <circle cx="16" cy="16" r="16" fill="#475569" />
      <rect x="8" y="10.5" width="16" height="11" rx="2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M8.5 11.5 16 17l7.5-5.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
