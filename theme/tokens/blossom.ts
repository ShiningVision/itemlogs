// theme/tokens/blossom.ts
//
// Rose pink + plum, on a soft blush base. Test theme built to try out a
// palette aimed at a female-leaning audience — same token shape as every
// other theme (see types.ts), just different values, per the "tokens only,
// no structural branching" theming model documented in theme/ThemeProvider.tsx.
// Radius is bumped up a bit versus default/sunset/forest (6/10/14 instead of
// 4/6/8) for a softer, rounder, "plush" feel that fits the palette — still
// just token values, no new component variants.
import { ThemeTokens } from './types';

const blossomTokens: ThemeTokens = {
  colorScheme: 'light',
  color: {
    primary: '#db2777', // rose-600
    primaryHover: '#be185d', // rose-700
    secondary: '#9333ea', // purple-600 — plum accent, pairs with rose without both competing as "the pink"
    background: '#fff5f8',
    backgroundImage: null,
    surface: '#ffe4ef',
    text: '#4a1942',
    textMuted: '#a15a7c',
    border: '#fbcfe8',
    danger: '#dc2626',
    success: '#16a34a',
    successHover: '#15803d',
  },
  font: {
    family:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    sizeBase: '14px',
    sizeLg: '18px',
    sizeXl: '28px',
    sizeSm: '12px',
    weightNormal: 400,
    weightBold: 600,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(219, 39, 119, 0.12)',
    md: '0 4px 12px rgba(219, 39, 119, 0.22)',
  },
  motion: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hoverLift: 'translateY(-2px)',
    hoverShadow: '0 10px 15px -3px rgb(219 39 119 / 0.15), 0 4px 6px -4px rgb(219 39 119 / 0.1)',
    activeScale: 'scale(0.98)',
  },
};

export default blossomTokens;
