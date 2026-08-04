// app/lib/actions/themes.ts
'use server';

import { getSettings, updateSettings } from '@/app/lib/services/settings';
import { THEME_TRIAL_DURATION_MS } from '@/app/lib/themeCatalog';
import { fetchThemeStatuses, reportThemeTried } from '@/app/lib/central-site';
import { revalidatePath } from 'next/cache';

// Switch to a theme this install actually owns. 'default' needs no
// verification (it isn't sold); everything else is checked against the
// central site's purchased flag on every switch, rather than trusting the
// local owned_themes/tried_themes columns (which are no longer written to —
// see themes/page.tsx) — a tenant fully controls their own database, so
// local state alone was never a real ownership check.
export async function selectThemeAction(themeName: string) {
  if (themeName === 'default') {
    await updateSettings({ theme: 'default', theme_trial_expires_at: null });
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard/themes');
    return { success: true as const };
  }

  const settings = await getSettings();
  if (!settings.app_url) return { error: 'notOwned' as const };

  const statuses = await fetchThemeStatuses(settings.app_url);
  const entry = statuses?.find((t) => t.slug === themeName);
  if (!entry?.purchased) return { error: 'notOwned' as const };

  await updateSettings({ theme: themeName, theme_trial_expires_at: null });
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/themes');
  return { success: true as const };
}

// One-time trial of a not-yet-purchased theme. The "has this ever been
// tried" check is enforced centrally (see itemlogs-website's
// app/api/try_theme) so it can't be reset by editing local settings; the
// 10-minute preview window itself stays local/client-trusted — that part
// is just a UX nicety, not a purchase gate, so a self-hosted tenant
// stretching their own preview a bit isn't a real problem.
export async function tryThemeAction(themeName: string) {
  const settings = await getSettings();
  if (!settings.app_url) return { error: 'invalidTheme' as const };

  const statuses = await fetchThemeStatuses(settings.app_url);
  const entry = statuses?.find((t) => t.slug === themeName);
  if (!entry) return { error: 'invalidTheme' as const };
  if (entry.purchased) return { error: 'alreadyOwned' as const };
  if (entry.tried) return { error: 'alreadyTried' as const };

  const reported = await reportThemeTried(settings.app_url, themeName);
  if (!reported.ok) return { error: 'centralUnreachable' as const };

  const expiresAt = new Date(Date.now() + THEME_TRIAL_DURATION_MS).toISOString();
  await updateSettings({
    theme: themeName,
    theme_trial_expires_at: expiresAt,
  });

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/themes');
  return { success: true as const, expiresAt };
}
