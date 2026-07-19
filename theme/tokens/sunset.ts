// theme/tokens/sunset.ts
import { ThemeTokens } from './types';

const sunsetTokens: ThemeTokens = {
  color: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#ec4899',
    background: '#fff7ed',
    backgroundImage: null,
    surface: '#ffedd5',
    text: '#431407',
    textMuted: '#9a5b3a',
    border: '#fdba74',
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
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(154, 52, 18, 0.12)',
    md: '0 4px 12px rgba(154, 52, 18, 0.22)',
  },
  motion: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hoverLift: 'translateY(-2px)',
    hoverShadow: '0 10px 15px -3px rgb(154 52 18 / 0.15), 0 4px 6px -4px rgb(154 52 18 / 0.1)',
    activeScale: 'scale(0.98)',
  },
};

export default sunsetTokens;
