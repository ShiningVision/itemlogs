// app/dashboard/(protected)/sales/[id]/sell/page.tsx
import { redirect } from 'next/navigation';
import { getItems, getUncategorizedItemCounts, OTHER_FILTER_ID, type ItemSort } from '@/app/lib/services/items';
import { getCategories, getCategoryItemCounts } from '@/app/lib/services/categories';
import { getTypes, getTypeItemCounts } from '@/app/lib/services/types';
import { typesEnabled } from '@/app/lib/typesEnabled';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getSettings } from '@/app/lib/services/settings';
import { getSaleById } from '@/app/lib/services/sales';
import { resolveLabel } from '@/app/lib/labels';
import { SellPicker } from '@/components/sales/SellPicker';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import { SELLABLE_STATUSES } from '@/app/lib/sellableStatuses';
import { parseIdList } from '@/app/lib/idList';

const SELL_PAGE_SIZE = 24;

type SearchParams = {
  categories?: string;
  types?: string;
  locations?: string;
  xcategories?: string;
  xtypes?: string;
  xlocations?: string;
  statuses?: string;
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
  const { categories: categoriesParam, types: typesParam, locations: locationsParam, xcategories: xcategoriesParam, xtypes: xtypesParam, xlocations: xlocationsParam, statuses: statusesParam, page: pageParam, search: searchParam } = rawSearchParams;

  const settings = await getSettings();
  // Same guard as the sale-edit page and the sales list — this whole
  // feature only makes sense with sell prices in use.
  if (!settings.use_sell_price) {
    redirect('/dashboard/items');
  }

  const sale = await getSaleById(saleId);

  const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
  // Ignored with types turned off (see typesEnabled) — see the dashboard
  // items page.
  const typeIds = typesEnabled(settings) && typesParam ? typesParam.split(',').map(Number) : undefined;
  const locationIds = locationsParam ? locationsParam.split(',').map(Number) : undefined;
  const excludedCategoryIds = parseIdList(xcategoriesParam);
  const excludedTypeIds = typesEnabled(settings) ? parseIdList(xtypesParam) : [];
  const excludedLocationIds = parseIdList(xlocationsParam);
  const search = searchParam?.trim() || undefined;

  // Defaults to every sellable status (Available, Reserved, status 5). A
  // `statuses` param narrows it, but is always clamped to the sellable set —
  // a hand-edited URL can't surface Sold/Soon items here — and the `all`
  // sentinel (last pill deselected, see ItemFiltersBar) means "every
  // sellable status", never "every status".
  const statuses =
    statusesParam && statusesParam !== 'all'
      ? statusesParam.split(',').map(Number).filter((s) => SELLABLE_STATUSES.includes(s))
      : SELLABLE_STATUSES;
  const effectiveStatuses = statuses.length > 0 ? statuses : SELLABLE_STATUSES;

  const page = parsePage(pageParam);
  const offset = getOffset(page, SELL_PAGE_SIZE);

  const [{ items, totalCount }, categories, types, locations, uncategorizedCounts, categoryItemCounts, typeItemCounts, locationItemCounts] =
    await Promise.all([
      // Only sellable statuses (see SELLABLE_STATUSES) — Available,
      // Reserved and the custom 5th status.
      getItems({
        categoryIds,
        statuses: effectiveStatuses,
        typeIds,
        locationIds,
        excludeCategoryIds: excludedCategoryIds,
        excludeTypeIds: excludedTypeIds,
        excludeLocationIds: excludedLocationIds,
        search,
        sort: 'newest' as ItemSort,
        limit: SELL_PAGE_SIZE,
        offset,
      }),
      getCategories(),
      typesEnabled(settings) ? getTypes() : Promise.resolve([]),
      getLocations(),
      getUncategorizedItemCounts(),
      getCategoryItemCounts(),
      typesEnabled(settings) ? getTypeItemCounts() : Promise.resolve({} as Record<number, number>),
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
  const status5Label = resolveLabel(settings.name_status, t('status5'));

  const otherLabel = t('other');
  if (uncategorizedCounts.category > 0) {
    sortedCategories.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }
  if (typesEnabled(settings) && uncategorizedCounts.type > 0) {
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
          showTypes: typesEnabled(settings),
          locationItemCounts,
          selectedCategoryIds: categoryIds ?? [],
          selectedTypeIds: typeIds ?? [],
          selectedLocationIds: locationIds ?? [],
          excludedCategoryIds,
          excludedTypeIds,
          excludedLocationIds,
          selectedStatuses: effectiveStatuses,
          sellableStatuses: SELLABLE_STATUSES,
          status5Label,
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
