// app/dashboard/(protected)/items/[id]/edit/page.tsx
import { getItemById } from '@/app/lib/services/items';
import { getItemImages } from '@/app/lib/services/item-images';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getSettings } from '@/app/lib/services/settings';
import { ItemForm } from '@/components/items/ItemForm';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, galleryImages, categories, types, locations, locationItemCounts, currencies, settings] = await Promise.all([
    getItemById(Number(id)),
    getItemImages(Number(id)),
    getCategories(),
    getTypes(),
    getLocations(),
    getLocationItemCounts(),
    getCurrencies(),
    getSettings(),
  ]);

  return (
    <ItemForm
      mode="update"
      item={item}
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