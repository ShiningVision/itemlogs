// lib/services/settings.ts
import { supabase } from '../../lib/db/client';
import type { UpdateSettingsInput } from '../../lib/validation/settings';
import { hasRealItem } from './items';

// Every item's sell_price/cost_price is denominated in this single
// shop-wide currency (items no longer carry their own sell_price_currency),
// so resolve it here once and let every consumer of settings read
// settings.sell_currency instead of a per-item join.
const SETTINGS_SELECT = `
  *,
  sell_currency:sell_price_currency(currency_code, currency_symbol)
`;

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select(SETTINGS_SELECT)
    .eq('id', 1)
    .single();

  if (error) throw error;

  // Theme trials are time-boxed (see app/lib/actions/themes.ts). If the
  // trial window has passed, self-heal back to the default theme right here
  // so every call site (root layout, settings page, themes page) picks up
  // the revert automatically without needing its own expiry check.
  if (data.theme_trial_expires_at && new Date(data.theme_trial_expires_at).getTime() <= Date.now()) {
    const { data: reverted, error: revertError } = await supabase
      .from('settings')
      .update({ theme: 'default', theme_trial_expires_at: null })
      .eq('id', 1)
      .select(SETTINGS_SELECT)
      .single();

    if (!revertError && reverted) return reverted;
  }

  return data;
}

// Onboarding checklist steps are sticky: once a step is detected as done,
// it's written to `settings` and never flips back to false, even if the
// underlying condition later stops being true (e.g. the tenant deletes
// their only real item, or turns the storefront back off after having gone
// live once). Called from the dashboard page only — not folded into
// getSettings() itself, since that runs on every page load site-wide and
// this would add an extra items query on every one of them until the step
// is first ticked.
export async function syncOnboardingChecklist(settings: {
  checklist_added_item: boolean;
  checklist_named_storefront: boolean;
  checklist_went_live: boolean;
  storefront_name: string | null;
  show: boolean;
}) {
  const updates: Record<string, boolean> = {};

  if (!settings.checklist_added_item && (await hasRealItem())) {
    updates.checklist_added_item = true;
  }
  if (!settings.checklist_named_storefront && Boolean(settings.storefront_name?.trim())) {
    updates.checklist_named_storefront = true;
  }
  if (!settings.checklist_went_live && settings.show) {
    updates.checklist_went_live = true;
  }

  if (Object.keys(updates).length === 0) return settings;

  const { data, error } = await supabase
    .from('settings')
    .update(updates)
    .eq('id', 1)
    .select(SETTINGS_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const { data, error } = await supabase
    .from('settings')
    .update(input)
    .eq('id', 1)
    .select(SETTINGS_SELECT)
    .single();

  if (error) throw error;
  return data;
}