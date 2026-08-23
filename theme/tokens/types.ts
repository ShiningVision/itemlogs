// theme/tokens/types.ts
export interface ThemeTokens {
  // Tells the browser whether to render native form controls (select
  // dropdown popups, scrollbars, etc.) in light or dark chrome. Not a CSS
  // custom property like everything else here — applyThemeTokens sets it
  // directly via the `color-scheme` CSS property instead of flattening it,
  // since our own --color-* variables only theme elements we draw
  // ourselves and have no effect on browser-native UI like an open
  // <select>'s option list.
  colorScheme: 'light' | 'dark';
  color: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    backgroundImage: string | null;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    danger: string;
    success: string;
    successHover: string;
  };
  font: {
    family: string;
    sizeBase: string;
    sizeLg: string;
    sizeXl: string;
    sizeSm: string;
    weightNormal: number;
    weightBold: number;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadow: {
    sm: string;
    md: string;
  };
  motion: {
    duration: string;
    easing: string;
    hoverLift: string;    // e.g. 'translateY(-2px)'
    hoverShadow: string;
    activeScale: string;  // e.g. 'scale(0.98)'
  };
}