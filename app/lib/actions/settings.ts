// lib/actions/settings.ts
'use server';

import { updateSettings } from '@/app/lib/services/settings';
import { updateSettingsSchema } from '@/app/lib/validation/settings';
import { revalidatePath } from 'next/cache';

// Boolean/select fields on the dashboard's storefront settings that
// auto-save the instant they change (visibility toggles, pricing toggles,
// item-detail toggles, layout) — everything except the free-text fields
// below (collection name/tagline, contact info, announcement message).
const STOREFRONT_AUTOSAVE_FIELDS = [
  'show',
  'show_status_1',
  'show_status_2',
  'show_status_3',
  'show_status_4',
  'show_contact',
  'show_sell_price',
  'show_purchase_price',
  'show_cost_price',
  'show_location',
  'show_package_filter',
  'show_location_filter',
  'storefront_density',
  // Package label override — moved here from the batch-saved
  // updateNameSettingsAction (see GeneralSettingsForm) since it only ever
  // affects the visitor page, same reasoning as everything else in this
  // list living in Visitor Page Settings instead of General Settings.
  'name_package',
  // WhatsApp contact number — save-on-blur like every other free-text
  // field added since (name overrides, name_package above), rather than
  // batch-saved through updateStorefrontTextSettingsAction below like the
  // older storefront_name/tagline/contact_info trio.
  'contact_whatsapp',
  'show_featured_items',
  'show_description',
] as const;

type StorefrontAutosaveField = (typeof STOREFRONT_AUTOSAVE_FIELDS)[number];

export async function updateStorefrontSettingFieldAction(
  field: StorefrontAutosaveField,
  value: string | number | boolean,
) {
  if (!STOREFRONT_AUTOSAVE_FIELDS.includes(field)) {
    return { error: 'invalidField' };
  }

  const parsed = updateSettingsSchema.safeParse({ [field]: value });
  if (!parsed.success) {
    return { error: 'invalid' };
  }

  // Validation catches the length/type problems Zod knows to check for, but
  // updateSettings() can still fail for reasons it can't (a DB constraint
  // Zod doesn't mirror, a dropped connection, ...). Without this try/catch
  // that threw straight out of the server action — every call site's
  // autosave handler awaits this function expecting it to always resolve
  // to a plain { success } / { error } object, not reject, so an uncaught
  // throw here meant the field's "Saving…" indicator never resolved into
  // "Saved."/"Failed to save." at all, with nothing telling the user
  // anything went wrong.
  try {
    await updateSettings(parsed.data);
  } catch (error) {
    console.error('Failed to update storefront setting:', error);
    return { error: 'saveFailed' };
  }
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

// Free-text storefront fields are batch-saved together via an explicit
// Save button rather than firing per keystroke.
export async function updateStorefrontTextSettingsAction(formData: FormData) {
  const raw = {
    storefront_name: (formData.get('storefront_name') as string) || null,
    storefront_tagline: (formData.get('storefront_tagline') as string) || null,
    show_message: (formData.get('show_message') as string) || null,
  };

  const parsed = updateSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  try {
    await updateSettings(parsed.data);
  } catch (error) {
    console.error('Failed to update storefront text settings:', error);
    return { error: 'saveFailed' };
  }
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}


// Fields on the general settings page that auto-save the instant they
// change (currency/language pickers, functionality + preference toggles),
// plus the free-text label overrides — those used to be batch-saved via a
// separate action + explicit Save button (updateNameSettingsAction, now
// removed), but save-on-blur here instead, same as every other field in
// this list. name_item is deliberately absent — see the comment on
// PREFERENCE_NAME_FIELDS in GeneralSettingsForm.tsx for why it's not
// exposed in the UI; add it here too whenever that changes. name_package
// isn't here at all — it moved to STOREFRONT_AUTOSAVE_FIELDS above, since
// it only affects the visitor page (see PackageVisibilitySection).
const GENERAL_SETTINGS_AUTOSAVE_FIELDS = [
  'sell_price_currency',
  'default_purchase_price_currency',
  'language',
  'use_sell_price',
  'use_barcode',
  'use_package_fees',
  'use_secret_notes',
  'display_profit',
  'display_sell_price',
  'display_purchase_price',
  'display_cost_price',
  'name_category',
  'name_type',
  'name_status',
  'name_location',
] as const;

type GeneralSettingsAutosaveField = (typeof GENERAL_SETTINGS_AUTOSAVE_FIELDS)[number];

export async function updateGeneralSettingFieldAction(
  field: GeneralSettingsAutosaveField,
  value: string | number | boolean,
) {
  if (!GENERAL_SETTINGS_AUTOSAVE_FIELDS.includes(field)) {
    return { error: 'invalidField' };
  }

  const parsed = updateSettingsSchema.safeParse({ [field]: value });
  if (!parsed.success) {
    return { error: 'invalid' };
  }

  try {
    await updateSettings(parsed.data);
  } catch (error) {
    console.error('Failed to update general setting:', error);
    return { error: 'saveFailed' };
  }
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/items'); // display_* flags affect the item cards there
  revalidatePath('/'); // sell_price_currency is shown on every storefront price
  return { success: true };
}

