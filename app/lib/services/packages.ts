// lib/services/packages.ts
import { supabase } from '../../lib/db/client';
import type { CreatePackageInput, UpdatePackageInput } from '../../lib/validation/packages';
import { getExchangeRate } from './exchange-rates';
import { getItemsByPackageId } from './items';
import { deletePackageDocuments } from './documents';

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

// Item status values used by the package "Mark items Soon/Available" action
// (see items.status: 1 Available, 4 Soon — the status formerly named "Lost").
const STATUS_AVAILABLE = 1;
const STATUS_SOON = 4;

// Bulk-flips a package's items between Available and Soon, and ONLY between
// those two: marking Soon touches just the package's Available items, marking
// Available touches just its Soon items. Anything else in the package (Sold,
// Reserved, the custom 5th status) is deliberately left alone — that's the
// whole point of filtering on the source status in the UPDATE itself, rather
// than fetching items and filtering afterwards. Returns how many changed.
export async function setPackageItemsSoonOrAvailable(
  packageId: number,
  target: 'soon' | 'available'
): Promise<number> {
  const from = target === 'soon' ? STATUS_AVAILABLE : STATUS_SOON;
  const to = target === 'soon' ? STATUS_SOON : STATUS_AVAILABLE;

  const { data, error } = await supabase
    .from('items')
    .update({ status: to })
    .eq('package_id', packageId)
    .eq('status', from)
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

// Dashboard "total packages" stat — cheap count-only query, no row fetch.
export async function getPackagesTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('packages')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data;
}

// Every package's id/name/current visibility, for the dashboard's
// PackageVisibilitySection — a single list of toggles ("show on visitor
// page") the owner manages centrally instead of per package. Lighter than
// getPackages()'s `select('*')` since this list only needs to render name +
// toggle, not pricing/date fields.
export async function getPackagesForVisibility(): Promise<
  { id: number; name: string; show_on_storefront: boolean }[]
> {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, show_on_storefront')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
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
  // Documents belonging to this package would otherwise be orphaned in
  // Vercel Blob — ON DELETE CASCADE cleans up their DB rows automatically,
  // but can't touch the actual blob files, so delete those first.
  await deletePackageDocuments(id);

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

  // A blank tariff or shipping fee means "no such fee" — treated as 0
  // rather than an error (e.g. a package with shipping but no tariff is
  // normal). The currency columns are NOT NULL with defaults, so they're
  // always usable even when the amount is blank.
  const tariff = pkg.tariff ?? 0;
  const shippingFee = pkg.shipping_fee ?? 0;

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
  const totalFeesPivot = tariff * tariffToPivot + shippingFee * shippingToPivot;

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