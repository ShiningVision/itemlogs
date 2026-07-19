// app/dashboard/(protected)/items/new/page.tsx
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getSettings } from '@/app/lib/services/settings';
import { getFeaturedItemCount, FEATURED_ITEM_CAP } from '@/app/lib/services/items';
import { ItemForm } from '@/components/items/ItemForm';

export default async function NewItemPage() {
  const [categories, types, currencies, settings, featuredCount] = await Promise.all([
    getCategories(),
    getTypes(),
    getCurrencies(),
    getSettings(),
    getFeaturedItemCount(),
  ]);

  return (
    <ItemForm
      mode="create"
      categories={categories}
      types={types}
      currencies={currencies}
      settings={settings}
      featuredCount={featuredCount}
      featuredCap={FEATURED_ITEM_CAP}
    />
  );
}