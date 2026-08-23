// theme/tokens/default.ts
import { ThemeTokens } from './types';

const defaultTokens: ThemeTokens = {
  colorScheme: 'light',
  color: {
    primary: '#3b82f6',
    primaryHover: '#2563eb', // blue-600
    secondary: '#6366f1',
    background: '#ffffff',
    backgroundImage: null,
    surface: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
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