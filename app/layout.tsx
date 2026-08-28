// app/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { themes } from '@/theme/tokens';
import localFont from 'next/font/local';
import './globals.css';
import { getSettings } from '@/app/lib/services/settings';

// Fonts reserved for the dashboard flavour-text ticker (see
// FlavourTicker.tsx) — everything else keeps the system-ui font. Self-hosted
// from public/fonts (no Google Fonts requests at build or runtime —
// next/font/local never talks to any network).
//
// The ticker originally went for a "digital billboard" look via a 7-segment
// LED font (DSEG7 Classic) for Latin locales, but that font is drawn for
// calculator/clock-style digit displays — it's missing or badly distorts
// most accented Latin letters, so anything beyond English (é, ü, ñ, ...)
// came out looking broken rather than stylized. Latin locales now just use
// a normal, readable sans-serif stack instead (see .flavour-ticker-item in
// globals.css) — no self-hosted font needed for them. zh/ja/ko still each
// get their own clean monospaced-feel Noto Sans variant for their script,
// since the system-ui fallback can't be trusted to have those glyphs on
// every platform — FlavourTicker picks between them based on the active
// locale.
const flavourZhFont = localFont({
  src: [
    { path: '../public/fonts/NotoSansSC-Regular.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-flavour-zh',
});

const flavourJaFont = localFont({
  src: [
    { path: '../public/fonts/NotoSansJP-Regular.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-flavour-ja',
});

const flavourKoFont = localFont({
  src: [
    { path: '../public/fonts/NotoSansKR-Regular.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-flavour-ko',
});

const flavourFontVariables = [
  flavourZhFont.variable,
  flavourJaFont.variable,
  flavourKoFont.variable,
].join(' ');

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  let initialThemeName = 'default';
  try {
    const settings = await getSettings();
    if (settings.theme) initialThemeName = settings.theme;
  } catch {
    // Fall back to 'default' if settings lookup fails
  }

  // Set server-side, from the same theme the ThemeProvider below resolves
  // client-side, so the very first paint's native form controls (an open
  // <select>'s option list, scrollbars) already match the theme instead of
  // briefly rendering in the browser's light-mode default before the
  // client effect in ThemeProvider/applyThemeTokens catches up.
  const colorScheme = (themes[initialThemeName] ?? themes.default).colorScheme;

  return (
    <html lang="en" className={flavourFontVariables} style={{ colorScheme }}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider initialThemeName={initialThemeName}>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}