// app/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/theme/ThemeProvider';
import localFont from 'next/font/local';
import './globals.css';
import { getSettings } from '@/app/lib/services/settings';

// A handwritten-but-tidy font reserved for playful flourishes (like the
// dashboard flavour text) — everything else keeps the system-ui font.
// Self-hosted from public/fonts (no Google Fonts requests at build or
// runtime — next/font/local never talks to any network).
const patrickHand = localFont({
  src: [
    { path: '../public/fonts/PatrickHand-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/PatrickHand-Regular.woff', weight: '400', style: 'normal' },
  ],
  variable: '--font-casual',
});

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

  return (
    <html lang="en" className={patrickHand.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider initialThemeName={initialThemeName}>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}