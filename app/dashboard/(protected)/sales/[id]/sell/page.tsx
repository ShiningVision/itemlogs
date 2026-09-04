// app/dashboard/(protected)/sales/[id]/sell/page.tsx
import { redirect } from 'next/navigation';
import { getItems, getUncategorizedItemCounts, OTHER_FILTER_ID, type ItemSort } from '@/app/lib/services/items';
import { getCategories, getCategoryItemCounts } from '@/app/lib/services/categories';
import { getTypes, getTypeItemCounts } from '@/app/lib/services/types';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getSettings } from '@/app/lib/services/settings';
import { getSaleById } from '@/app/lib/services/sales';
import { resolveLabel } from '@/app/lib/labels';
import { SellPicker } from '@/components/sales/SellPicker';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';

const SELL_PAGE_SIZE = 24;

type SearchParams = {
  categories?: string;
  types?: string;
  locations?: string;
  page?: string;
  search?: string;
};

export default async function SellIntoSalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const saleId = Number(id);
  const rawSearchParams = await searchParams;
  const { categories: categoriesParam, types: typesParam, locations: locationsParam, page: pageParam, search: searchParam } = rawSearchParams;

  const settings = await getSettings();
  // Same guard as the sale-edit page and the sales list — this whole
  // feature only makes sense with sell prices in use.
  if (!settings.use_sell_price) {
    redirect('/dashboard/items');
  }

  const sale = await getSaleById(saleId);

  const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
  const typeIds = typesParam ? typesParam.split(',').map(Number) : undefined;
  const locationIds = locationsParam ? locationsParam.split(',').map(Number) : undefined;
  const search = searchParam?.trim() || undefined;

  const page = parsePage(pageParam);
  const offset = getOffset(page, SELL_PAGE_SIZE);

  const [{ items, totalCount }, categories, types, locations, uncategorizedCounts, categoryItemCounts, typeItemCounts, locationItemCounts] =
    await Promise.all([
      // Always status 1 (Available) — this page only ever offers items that
      // can actually be sold, so there's no status filter to show at all
      // (see ItemFiltersBar's hideStatusFilter).
      getItems({
        categoryIds,
        statuses: [1],
        typeIds,
        locationIds,
        search,
        sort: 'newest' as ItemSort,
        limit: SELL_PAGE_SIZE,
        offset,
      }),
      getCategories(),
      getTypes(),
      getLocations(),
      getUncategorizedItemCounts(),
      getCategoryItemCounts(),
      getTypeItemCounts(),
      getLocationItemCounts(),
    ]);

  const totalPages = getTotalPages(totalCount, SELL_PAGE_SIZE);

  function byUsageThenAlpha(counts: Record<number, number>) {
    return (a: { id: number; name: string | null }, b: { id: number; name: string | null }) => {
      const usageDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
      return usageDiff !== 0 ? usageDiff : (a.name ?? '').localeCompare(b.name ?? '');
    };
  }
  const sortedCategories = [...categories].sort(byUsageThenAlpha(categoryItemCounts));
  const sortedTypes = [...types].sort(byUsageThenAlpha(typeItemCounts));
  const sortedLocations = [...locations].sort(byUsageThenAlpha(locationItemCounts));

  const t = await getTranslations('items');
  const tSales = await getTranslations('sales');
  const categoryLabel = resolveLabel(settings.name_category, t('category'));
  const typeLabel = resolveLabel(settings.name_type, t('type'));
  const locationLabel = resolveLabel(settings.name_location, t('location'));

  const otherLabel = t('other');
  if (uncategorizedCounts.category > 0) {
    sortedCategories.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }
  if (uncategorizedCounts.type > 0) {
    sortedTypes.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <SellPicker
        saleId={saleId}
        items={items}
        settings={settings}
        currencySymbol={settings.sell_currency?.currency_symbol ?? ''}
        showBarcodeScanner={settings.use_barcode}
        title={tSales('sellIntoSaleTitle', { name: sale.name ?? sale.date })}
        backHref={`/dashboard/sales/${saleId}/edit`}
        emptyMessage={tSales('noAvailableItemsToSell')}
        filtersBar={{
          categories: sortedCategories,
          types: sortedTypes,
          locations: sortedLocations,
          categoryItemCounts,
          typeItemCounts,
          locationItemCounts,
          selectedCategoryIds: categoryIds ?? [],
          selectedTypeIds: typeIds ?? [],
          selectedLocationIds: locationIds ?? [],
          categoryLabel,
          typeLabel,
          locationLabel,
          search: search ?? '',
        }}
      />

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref(`/dashboard/sales/${saleId}/sell`, rawSearchParams, p)} />
    </div>
  );
}
