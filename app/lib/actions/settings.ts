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

  await updateSettings(parsed.data);
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
    contact_info: (formData.get('contact_info') as string) || null,
    show_message: (formData.get('show_message') as string) || null,
  };

  const parsed = updateSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await updateSettings(parsed.data);
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}


// Fields on the general settings page that auto-save the instant they
// change (currency/language pickers, functionality + preference toggles) —
// everything except the free-text label overrides below.
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

  await updateSettings(parsed.data);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/items'); // display_* flags affect the item cards there
  revalidatePath('/'); // sell_price_currency is shown on every storefront price
  return { success: true };
}

// The label-override fields are batch-saved together via an explicit Save
// button rather than firing per keystroke.
export async function updateNameSettingsAction(formData: FormData) {
  const raw = {
    name_category: (formData.get('name_category') as string) || null,
    name_type: (formData.get('name_type') as string) || null,
    name_status: (formData.get('name_status') as string) || null,
    name_package: (formData.get('name_package') as string) || null,
    name_item: (formData.get('name_item') as string) || null,
  };

  const parsed = updateSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await updateSettings(parsed.data);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/items');
  return { success: true };
}