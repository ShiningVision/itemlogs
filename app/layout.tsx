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
// The ticker went for a "digital billboard" look, but no single typeface
// covers both an LED/segment-display style AND CJK glyphs — that aesthetic
// simply hasn't been drawn for Chinese/Japanese/Korean. So Latin locales get
// a real 7-segment display font (DSEG7 Classic), while zh/ja/ko each get a
// clean monospaced-feel Noto Sans variant for their script — FlavourTicker
// picks between them based on the active locale.
const flavourLatinFont = localFont({
  src: [
    { path: '../public/fonts/DSEG7Classic-Regular.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-flavour-latin',
});

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
  flavourLatinFont.variable,
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