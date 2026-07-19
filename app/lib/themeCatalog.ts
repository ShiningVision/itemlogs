// app/lib/themeCatalog.ts
// The set of themes the app knows how to render (must match the keys
// registered in theme/ThemeProvider.tsx). "free" themes are always
// considered owned by every install; the rest are gated behind
// owned_themes/tried_themes on the settings row.
export type ThemeCatalogEntry = {
  name: string;
  labelKey: string;
  free: boolean;
  price?: string;
};

export const THEME_CATALOG: ThemeCatalogEntry[] = [
  { name: 'default', labelKey: 'themeDefault', free: true },
  { name: 'dark', labelKey: 'themeDark', free: true },
  { name: 'sunset', labelKey: 'themeSunset', free: false, price: '$4.99' },
  { name: 'forest', labelKey: 'themeForest', free: false, price: '$4.99' },
];

export const THEME_TRIAL_DURATION_MS = 10 * 60 * 1000;

export function isThemeOwned(themeName: string, ownedThemes: string[] | null | undefined): boolean {
  const entry = THEME_CATALOG.find((t) => t.name === themeName);
  if (!entry) return false;
  return entry.free || (ownedThemes ?? []).includes(themeName);
}
