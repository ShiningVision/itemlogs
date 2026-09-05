// theme/tokens/default.ts
import { ThemeTokens } from './types';

// Amber & teal, on a warm-neutral base — matches the dashboard's own
// palette (see app/globals.css) and itemlogs-website's palette, so a
// tenant's storefront on the free default theme still reads as the same
// product/brand as the dashboard and marketing site, rather than the old
// generic-SaaS blue-on-white.
const defaultTokens: ThemeTokens = {
  colorScheme: 'light',
  color: {
    primary: '#d97706',
    primaryHover: '#b45309', // amber-700
    secondary: '#0f766e',
    background: '#fafaf9',
    backgroundImage: null,
    surface: '#ffffff',
    text: '#292524',
    textMuted: '#78716c',
    border: '#e7e5e4',
    danger: '#ef4444',
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
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  motion: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Tailwind's default ease
    hoverLift: 'translateY(-2px)',
    hoverShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
    activeScale: 'scale(0.98)',
  },
};

export default defaultTokens;