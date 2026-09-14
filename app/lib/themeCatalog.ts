// app/lib/themeCatalog.ts
//
// Local display metadata only — labelKey (translation) and the preview
// image slug (must match /public/themes/<name>.svg and the keys registered
// in theme/ThemeProvider.tsx). Ownership and price are NOT decided here
// anymore: they come from the central site (see app/lib/central-site.ts),
// since a tenant's own database can't be trusted as the source of truth
// for what they've actually paid for.
//
// 'default' is the one exception — it's not a sellable theme at all (never
// appears in the central catalog), so it's always available without any
// verification.
export type ThemeCatalogEntry = {
  name: string;
  labelKey: string;
};

export const THEME_DISPLAY_CATALOG: ThemeCatalogEntry[] = [
  { name: 'default', labelKey: 'themeDefault' },
  { name: 'dark', labelKey: 'themeDark' },
  { name: 'sunset', labelKey: 'themeSunset' },
  { name: 'forest', labelKey: 'themeForest' },
  // Priced at $4.99, same as dark/sunset/forest — see itemlogs-website's
  // app/lib/db/schema.sql for the migration comment + the themes table row
  // this needs (INSERT INTO themes ...). Until that INSERT is actually run
  // against the live D1 database, this will behave like an unregistered
  // theme on the real Themes page: selectThemeAction/tryThemeAction
  // (app/lib/actions/themes.ts) fail closed with no matching central-site
  // entry, so "Try it out" appears but silently does nothing.
  { name: 'blossom', labelKey: 'themeBlossom' },
];

export const THEME_TRIAL_DURATION_MS = 10 * 60 * 1000;
