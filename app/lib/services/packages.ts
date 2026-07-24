// lib/services/packages.ts
import { supabase } from '../../lib/db/client';
import type { CreatePackageInput, UpdatePackageInput } from '../../lib/validation/packages';
import { getExchangeRate } from './exchange-rates';
import { getItemsByPackageId } from './items';

export async function getPackageItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase.from('items').select('package_id');
  if (error) throw error;

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    if (row.package_id !== null) {
      counts[row.package_id] = (counts[row.package_id] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data;
}

// Only the packages the owner has explicitly opted into showing publicly —
// used to populate the storefront's single-select package filter dropdown.
export async function getPublicPackages(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name')
    .eq('show_on_storefront', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPackageById(id: number) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPackage(input: CreatePackageInput) {
  const { data, error } = await supabase
    .from('packages')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePackage(id: number, input: UpdatePackageInput) {
  const { data, error } = await supabase
    .from('packages')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePackage(id: number) {
  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function getCurrencyCode(currencyId: number): Promise<string> {
  const { data, error } = await supabase
    .from('currencies')
    .select('currency_code')
    .eq('id', currencyId)
    .single();

  if (error) throw error;
  return data.currency_code;
}
import { getSettings } from './settings';


export async function distributePackageFees(packageId: number) {
  const pkg = await getPackageById(packageId);

  if (pkg.shipping_fee === null || pkg.tariff === null) {
    throw new Error('Package shipping fee or tariff is missing');
  }

  const items = await getItemsByPackageId(packageId);
  if (!items || items.length === 0) {
    throw new Error('Package has no items');
  }

  const settings = await getSettings();
  // Items no longer have their own sell_price_currency — cost_price is
  // always written in the single shop-wide settings.sell_price_currency,
  // so that's both the pivot currency for this calculation and the final
  // output currency. No back-conversion needed at the end.
  const pivotCode = await getCurrencyCode(settings.sell_price_currency);

  const [tariffCode, shippingCode] = await Promise.all([
    getCurrencyCode(pkg.tariff_currency),
    getCurrencyCode(pkg.shipping_fee_currency),
  ]);

  const tariffToPivot = await getExchangeRate(tariffCode, pivotCode);
  const shippingToPivot = await getExchangeRate(shippingCode, pivotCode);
  const totalFeesPivot = pkg.tariff * tariffToPivot + pkg.shipping_fee * shippingToPivot;

  const itemsWithPivot = await Promise.all(
    items.map(async (item: any) => {
      const purchaseCode = item.purchase_currency?.currency_code ?? pivotCode;
      const rate = await getExchangeRate(purchaseCode, pivotCode);
      return { ...item, purchasePivot: (item.purchase_price ?? 0) * rate };
    })
  );

  const totalPurchasePivot = itemsWithPivot.reduce((sum, i) => sum + i.purchasePivot, 0);
  if (totalPurchasePivot === 0) {
    throw new Error('Total purchase price across items is zero; cannot distribute fees by weight');
  }

  const updates = await Promise.all(
    itemsWithPivot.map(async (item) => {
      const weight = item.purchasePivot / totalPurchasePivot;
      const itemFeePivot = totalFeesPivot * weight;
      const newCostPrice = itemFeePivot + item.purchasePivot;

      await supabase.from('items').update({ cost_price: newCostPrice }).eq('id', item.id);
      return { id: item.id, newCostPrice };
    })
  );

  return { updated: updates.length, details: updates };
}