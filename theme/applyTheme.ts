// theme/applyTheme.ts
import { ThemeTokens } from './tokens/types';

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;

  // Set directly rather than flattened into a --color-scheme custom
  // property — `color-scheme` is a real CSS property the browser reads to
  // decide how to paint native UI it renders itself (an open <select>'s
  // option list, scrollbars, etc.), which our own --color-* variables have
  // no effect on. Without this, a dark theme's dropdowns kept rendering
  // with the browser's default light chrome — right color text on our own
  // elements, but a stray white popup with black text for the native
  // options list.
  root.style.colorScheme = tokens.colorScheme;

  const flatten = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = `--${prefix}${key}`.replace(/([A-Z])/g, '-$1').toLowerCase();

      if (value !== null && typeof value === 'object') {
        flatten(value, `${prefix}${key}-`);
      } else if (value === null) {
        root.style.setProperty(varName, 'none');
      } else {
        root.style.setProperty(varName, String(value));
      }
    });
  };

  const { colorScheme: _colorScheme, ...cssVarTokens } = tokens;
  flatten(cssVarTokens);
}