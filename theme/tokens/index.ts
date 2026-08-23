// theme/tokens/index.ts
//
// Single source of truth for the theme-name -> tokens mapping, shared by
// both the client-side ThemeProvider (which applies tokens via CSS custom
// properties after mount) and the server-rendered root layout (which needs
// the initial theme's colorScheme up front, so the very first paint's
// native form controls — an open <select>'s option list, scrollbars —
// already match the theme instead of flashing light-then-dark).
import { ThemeTokens } from './types';
import defaultTokens from './default';
import darkTokens from './dark';
import sunsetTokens from './sunset';
import forestTokens from './forest';

export const themes: Record<string, ThemeTokens> = {
  default: defaultTokens,
  dark: darkTokens,
  sunset: sunsetTokens,
  forest: forestTokens,
};
