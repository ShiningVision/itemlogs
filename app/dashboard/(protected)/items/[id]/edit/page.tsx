// app/dashboard/(protected)/items/[id]/edit/page.tsx
import { getItemById } from '@/app/lib/services/items';
import { getItemImages } from '@/app/lib/services/item-images';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getSettings } from '@/app/lib/services/settings';
import { getSalesForItem } from '@/app/lib/services/sales-items';
import { getPackageSummary } from '@/app/lib/services/packages';
import { ItemForm } from '@/components/items/ItemForm';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, galleryImages, categories, types, locations, locationItemCounts, currencies, settings, linkedSales] = await Promise.all([
    getItemById(Number(id)),
    getItemImages(Number(id)),
    getCategories(),
    getTypes(),
    getLocations(),
    getLocationItemCounts(),
    getCurrencies(),
    getSettings(),
    getSalesForItem(Number(id)),
  ]);

  // The package the item belongs to, if any — shown on the dashboard
  // regardless of whether that package is published on the visitor page.
  const linkedPackage = item.package_id != null ? await getPackageSummary(item.package_id) : null;

  return (
    <ItemForm
      mode="update"
      item={item}
      linkedPackage={linkedPackage ? { id: linkedPackage.id, name: linkedPackage.name } : null}
      linkedSales={linkedSales}
      initialGalleryImages={galleryImages}
      categories={categories}
      types={types}
      locations={locations}
      locationItemCounts={locationItemCounts}
      currencies={currencies}
      settings={settings}
    />
  );
}