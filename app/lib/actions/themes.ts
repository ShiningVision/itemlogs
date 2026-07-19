// app/lib/actions/themes.ts
'use server';

import { getSettings, updateSettings } from '@/app/lib/services/settings';
import { THEME_CATALOG, THEME_TRIAL_DURATION_MS } from '@/app/lib/themeCatalog';
import { revalidatePath } from 'next/cache';

// Switch to a theme the install already owns (free themes, or ones bought
// centrally and recorded in owned_themes). Takes effect immediately; the
// client does a full page reload afterwards so the root layout re-resolves
// theme tokens server-side.
export async function selectThemeAction(themeName: string) {
  const entry = THEME_CATALOG.find((t) => t.name === themeName);
  if (!entry) return { error: 'invalidTheme' as const };

  const settings = await getSettings();
  const owned = entry.free || (settings.owned_themes ?? []).includes(themeName);
  if (!owned) return { error: 'notOwned' as const };

  await updateSettings({ theme: themeName, theme_trial_expires_at: null });
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/themes');
  return { success: true as const };
}

// One-time trial of a not-yet-purchased theme. Records it in tried_themes
// (so it can only ever be tried once) and switches to it for a fixed
// window; getSettings() self-heals the theme back to 'default' once that
// window has passed (see app/lib/services/settings.ts).
export async function tryThemeAction(themeName: string) {
  const entry = THEME_CATALOG.find((t) => t.name === themeName);
  if (!entry || entry.free) return { error: 'invalidTheme' as const };

  const settings = await getSettings();
  const ownedThemes = settings.owned_themes ?? [];
  if (ownedThemes.includes(themeName)) return { error: 'alreadyOwned' as const };

  const triedThemes = settings.tried_themes ?? [];
  if (triedThemes.includes(themeName)) return { error: 'alreadyTried' as const };

  const expiresAt = new Date(Date.now() + THEME_TRIAL_DURATION_MS).toISOString();
  await updateSettings({
    theme: themeName,
    tried_themes: [...triedThemes, themeName],
    theme_trial_expires_at: expiresAt,
  });

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/themes');
  return { success: true as const, expiresAt };
}
