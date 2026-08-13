// app/dashboard/(protected)/items/page.tsx
import { getItems, type ItemSort } from '@/app/lib/services/items';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { ItemFiltersBar } from '@/components/items/ItemFiltersBar';
import { SellModeControls } from '@/components/items/SellModeControls';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ItemDensityToggle } from '@/components/items/ItemDensityToggle';
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
  type?: string;
  sell?: string;
  saleId?: string;
  page?: string;
  density?: string;
  sort?: string;
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
    type: typeParam,
    sell,
    saleId: saleIdParam,
    page: pageParam,
    density: densityParam,
    sort: sortParam,
  } = rawSearchParams;

  const density: 'dense' | 'showcase' = densityParam === 'showcase' ? 'showcase' : 'dense';
  const sort: ItemSort = VALID_SORTS.includes(sortParam as ItemSort) ? (sortParam as ItemSort) : 'newest';

  const sellModeActive = sell === '1';
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
  const typeId = typeParam ? Number(typeParam) : undefined;
  const saleId = saleIdParam ? Number(saleIdParam) : undefined;

  const page = parsePage(pageParam);
  const offset = getOffset(page, ITEMS_PAGE_SIZE);

  // Export honors the same filters as the grid, but never the pagination —
  // it always covers every matching row, not just the current page.
  const exportParams = new URLSearchParams();
  if (categoryIds?.length) exportParams.set('categories', categoryIds.join(','));
  if (statuses?.length) exportParams.set('statuses', statuses.join(','));
  if (typeId !== undefined) exportParams.set('type', String(typeId));
  const exportHref = `/api/v1/items/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

  const [{ items, totalCount }, categories, types, settings] = await Promise.all([
    getItems({ categoryIds, statuses, typeId, sort, limit: ITEMS_PAGE_SIZE, offset }),
    getCategories(),
    getTypes(),
    getSettings(),
  ]);

  const totalPages = getTotalPages(totalCount, ITEMS_PAGE_SIZE);

  const sortedCategories = [...categories].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  const sortedTypes = [...types].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  const t = await getTranslations('items');
  const categoryLabel = resolveLabel(settings.name_category, t('category'));
  const typeLabel = resolveLabel(settings.name_type, t('type'));
  const statusLabel = resolveLabel(settings.name_status, t('filterStatuses'));

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
        selectedCategoryIds={categoryIds ?? []}
        selectedStatuses={statuses ?? []}
        selectedTypeId={typeId}
        sellModeActive={sellModeActive}
        categoryLabel={categoryLabel}
        typeLabel={typeLabel}
        statusLabel={statusLabel}
        manageCategoriesHref="/dashboard/categories"
        manageCategoriesLabel={t('manageLabel', { label: categoryLabel })}
        manageTypesHref="/dashboard/types"
        manageTypesLabel={t('manageLabel', { label: typeLabel })}
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
