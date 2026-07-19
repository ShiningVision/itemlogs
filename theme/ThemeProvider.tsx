// theme/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeTokens } from './tokens/types';
import { applyThemeTokens } from './applyTheme';
import defaultTokens from './tokens/default';
import darkTokens from './tokens/dark';
import sunsetTokens from './tokens/sunset';
import forestTokens from './tokens/forest';

const themes: Record<string, ThemeTokens> = {
  default: defaultTokens,
  dark: darkTokens,
  sunset: sunsetTokens,
  forest: forestTokens,
};

interface ThemeContextValue { themeName: string; tokens: ThemeTokens; setTheme: (name: string) => void }
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialThemeName = 'default',
}: {
  children: ReactNode;
  initialThemeName?: string;
}) {
  const resolvedInitial = themes[initialThemeName] ? initialThemeName : 'default';
  const [themeName, setThemeName] = useState(resolvedInitial);

  // `settings.theme` in the database is the source of truth (set via the
  // Themes page, which triggers a full page reload after switching) — the
  // server resolves `initialThemeName` fresh on every request, including
  // reverting an expired trial theme back to 'default'. We deliberately do
  // NOT read a cached value back out of localStorage on mount anymore: doing
  // so could resurrect a trial theme client-side after the server has
  // already reverted it in the database, which would defeat the trial
  // expiry. localStorage.setItem below is kept only so non-JS-driven reads
  // (if any are added later) have something to fall back on.
  useEffect(() => {
    applyThemeTokens(themes[themeName]);
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, tokens: themes[themeName], setTheme: (n) => themes[n] && setThemeName(n) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}