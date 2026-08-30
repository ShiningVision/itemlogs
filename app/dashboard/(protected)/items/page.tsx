// app/dashboard/(protected)/items/page.tsx
import { getItems, getUncategorizedItemCounts, OTHER_FILTER_ID, type ItemSort } from '@/app/lib/services/items';
import { getCategories, getCategoryItemCounts } from '@/app/lib/services/categories';
import { getTypes, getTypeItemCounts } from '@/app/lib/services/types';
import { getLocations, getLocationItemCounts } from '@/app/lib/services/locations';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { ItemFiltersBar } from '@/components/items/ItemFiltersBar';
import { SellModeControls } from '@/components/items/SellModeControls';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ItemDensityToggle, type ItemDensity } from '@/components/items/ItemDensityToggle';
import { ImportExcelButton } from '@/components/items/ImportExcelButton';
import { BarcodeSellScanner } from '@/components/items/BarcodeSellScanner';
import { SortSelect } from '@/components/ui/SortSelect';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/widgets/Button';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ITEMS_PAGE_SIZE = 24;

type SearchParams = {
  categories?: string;
  statuses?: string;
  types?: string;
  locations?: string;
  sell?: string;
  saleId?: string;
  page?: string;
  density?: string;
  sort?: string;
  search?: string;
};

const VALID_SORTS: ItemSort[] = ['newest', 'oldest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'];

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const {
    categories: categoriesParam,
    statuses: statusesParam,
    types: typesParam,
    locations: locationsParam,
    sell,
    saleId: saleIdParam,
    page: pageParam,
    density: densityParam,
    sort: sortParam,
    search: searchParam,
  } = rawSearchParams;

  const density: ItemDensity =
    densityParam === 'showcase' ? 'showcase' : densityParam === 'compact' ? 'compact' : 'dense';
  const sort: ItemSort = VALID_SORTS.includes(sortParam as ItemSort) ? (sortParam as ItemSort) : 'newest';

  // Settings has to be fetched before sellModeActive is computed (rather than
  // alongside items/categories/types below) so that a stale/bookmarked
  // ?sell=1 URL can't force sell mode on — and the per-card sell button with
  // it — after the owner has turned use_sell_price off.
  const settings = await getSettings();

  const sellModeActive = sell === '1' && settings.use_sell_price;
  const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
  // Defensive: even if a stale/crafted `statuses` param exists in the URL, sell mode always forces status 1 only.
  // No `statuses` param at all (fresh page load) defaults to Available-only.
  // Deselecting the last status pill sends the explicit sentinel `all`
  // (see ItemFiltersBar's toggleStatus) rather than removing the param, so
  // it can be told apart from a fresh, never-touched page load — `all`
  // means "no filter", undefined statuses here skips the .in() clause entirely.
  const statuses = sellModeActive
    ? [1]
    : statusesParam === undefined
      ? [1]
      : statusesParam === 'all'
        ? undefined
        : statusesParam.split(',').map(Number);
  const typeIds = typesParam ? typesParam.split(',').map(Number) : undefined;
  const locationIds = locationsParam ? locationsParam.split(',').map(Number) : undefined;
  const saleId = saleIdParam ? Number(saleIdParam) : undefined;
  const search = searchParam?.trim() || undefined;

  const page = parsePage(pageParam);
  const offset = getOffset(page, ITEMS_PAGE_SIZE);

  // Export honors the same filters as the grid, but never the pagination —
  // it always covers every matching row, not just the current page.
  const exportParams = new URLSearchParams();
  if (categoryIds?.length) exportParams.set('categories', categoryIds.join(','));
  if (statuses?.length) exportParams.set('statuses', statuses.join(','));
  if (typeIds?.length) exportParams.set('types', typeIds.join(','));
  if (locationIds?.length) exportParams.set('locations', locationIds.join(','));
  if (search) exportParams.set('search', search);
  const exportHref = `/api/v1/items/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

  const [{ items, totalCount }, categories, types, locations, uncategorizedCounts, categoryItemCounts, typeItemCounts, locationItemCounts] = await Promise.all([
    getItems({
      categoryIds,
      statuses,
      typeIds,
      locationIds,
      search,
      sort,
      limit: ITEMS_PAGE_SIZE,
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

  const totalPages = getTotalPages(totalCount, ITEMS_PAGE_SIZE);

  // Usage first, alphabetical as the tiebreak — this decides which tags
  // land in the filter bar's first two pill rows before the rest get
  // tucked behind its "more" button (see ItemFiltersBar/FilterPillRow), so
  // the most-used tags are always the ones visible by default.
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
  const categoryLabel = resolveLabel(settings.name_category, t('category'));
  const typeLabel = resolveLabel(settings.name_type, t('type'));
  const locationLabel = resolveLabel(settings.name_location, t('location'));
  const statusLabel = resolveLabel(settings.name_status, t('filterStatuses'));

  // "Other" isn't a real row (see app/lib/placeholder-data.ts) — it's how a
  // null category/type is interpreted app-wide (see ItemForm, Excel export/
  // import). Appended after sorting so it always lands last, and only shown
  // as a filter option when at least one item actually has no category/type
  // to bucket under it — mirrors the storefront's FilterSidebar treatment.
  const otherLabel = t('other');
  if (uncategorizedCounts.category > 0) {
    sortedCategories.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }
  if (uncategorizedCounts.type > 0) {
    sortedTypes.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>{t('title')}</h1>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Link href="/dashboard/items/new">
            <Button>
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              {t('addItem')}
            </Button>
          </Link>

          {settings.use_sell_price && <SellModeControls sellModeActive={sellModeActive} saleId={saleId} />}

          <ImportExcelButton />

          <a href={exportHref}>
            <Button style={{ background: 'var(--color-success)' }}>
              <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
              {t('exportExcel')}
            </Button>
          </a>

          {settings.use_sell_price && sellModeActive && settings.use_barcode && <BarcodeSellScanner saleId={saleId} />}
        </div>
      </div>

      <ItemFiltersBar
        categories={sortedCategories}
        types={sortedTypes}
        locations={sortedLocations}
        categoryItemCounts={categoryItemCounts}
        typeItemCounts={typeItemCounts}
        locationItemCounts={locationItemCounts}
        selectedCategoryIds={categoryIds ?? []}
        selectedStatuses={statuses ?? []}
        selectedTypeIds={typeIds ?? []}
        selectedLocationIds={locationIds ?? []}
        sellModeActive={sellModeActive}
        categoryLabel={categoryLabel}
        typeLabel={typeLabel}
        locationLabel={locationLabel}
        statusLabel={statusLabel}
        search={search ?? ''}
      />

      <div className="storefront-toolbar" style={{ marginTop: 'var(--spacing-lg)' }}>
        <SortSelect
          value={sort}
          label={t('sortLabel')}
          options={[
            { value: 'newest', label: t('sortNewest') },
            { value: 'oldest', label: t('sortOldest') },
            { value: 'name_asc', label: t('sortNameAsc') },
            { value: 'name_desc', label: t('sortNameDesc') },
            { value: 'price_asc', label: t('sortPriceAsc') },
            { value: 'price_desc', label: t('sortPriceDesc') },
          ]}
        />
        <ItemDensityToggle density={density} />
      </div>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <ItemGrid items={items} settings={settings} showDeleteButton sellMode={sellModeActive} saleId={saleId} density={density} />
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/items', rawSearchParams, p)} />
    </div>
  );
}
