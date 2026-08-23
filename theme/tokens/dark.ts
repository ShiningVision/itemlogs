// theme/tokens/dark.ts
import { ThemeTokens } from './types';

const darkTokens: ThemeTokens = {
  colorScheme: 'dark',
  color: {
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    secondary: '#818cf8',
    background: '#0f172a',
    backgroundImage: null,
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    danger: '#f87171',
    success: '#4ade80',
    successHover: '#22c55e',
  },
  font: {
    family: 'system-ui, sans-serif',
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
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
    md: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  motion: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hoverLift: 'translateY(-2px)',
    hoverShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    activeScale: 'scale(0.98)',
  },
};

export default darkTokens;
