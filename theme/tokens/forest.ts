// theme/tokens/forest.ts
import { ThemeTokens } from './types';

const forestTokens: ThemeTokens = {
  color: {
    primary: '#15803d',
    primaryHover: '#166534',
    secondary: '#a16207',
    background: '#f4f7f0',
    backgroundImage: null,
    surface: '#e7efe0',
    text: '#1a2e1a',
    textMuted: '#5b6f56',
    border: '#c3d4b8',
    danger: '#b91c1c',
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
    sm: '0 1px 3px rgba(26, 46, 26, 0.1)',
    md: '0 4px 12px rgba(26, 46, 26, 0.2)',
  },
  motion: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hoverLift: 'translateY(-2px)',
    hoverShadow: '0 10px 15px -3px rgb(26 46 26 / 0.15), 0 4px 6px -4px rgb(26 46 26 / 0.1)',
    activeScale: 'scale(0.98)',
  },
};

export default forestTokens;
