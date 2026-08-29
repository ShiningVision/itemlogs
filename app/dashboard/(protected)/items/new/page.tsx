// app/dashboard/(protected)/items/new/page.tsx
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getSettings } from '@/app/lib/services/settings';
import { ItemForm } from '@/components/items/ItemForm';

export default async function NewItemPage() {
  const [categories, types, locations, locationItemCounts, currencies, settings] = await Promise.all([
    getCategories(),
    getTypes(),
    getLocations(),
    getLocationItemCounts(),
    getCurrencies(),
    getSettings(),
  ]);

  return (
    <ItemForm
      mode="create"
      categories={categories}
      types={types}
      locations={locations}
      locationItemCounts={locationItemCounts}
      currencies={currencies}
      settings={settings}
    />
  );
}