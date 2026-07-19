// theme/applyTheme.ts
import { ThemeTokens } from './tokens/types';

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;

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

  flatten(tokens);
}