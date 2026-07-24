// app/dashboard/(protected)/items/page.tsx
import { getItems } from '@/app/lib/services/items';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { ItemFiltersBar } from '@/components/items/ItemFiltersBar';
import { SellModeControls } from '@/components/items/SellModeControls';
import { ItemsInfiniteGrid } from '@/components/items/ItemsInfiniteGrid';
import { ImportExcelButton } from '@/components/items/ImportExcelButton';
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
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const { categories: categoriesParam, statuses: statusesParam, type: typeParam, sell, saleId: saleIdParam } =
    rawSearchParams;

  const sellModeActive = sell === '1';
  const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
  // Defensive: even if a stale/crafted `statuses` param exists in the URL, sell mode always forces status 1 only.
  const statuses = sellModeActive ? [1] : statusesParam ? statusesParam.split(',').map(Number) : undefined;
  const typeId = typeParam ? Number(typeParam) : undefined;
  const saleId = saleIdParam ? Number(saleIdParam) : undefined;

  // Export honors the same filters as the grid, but always covers every
  // matching row rather than just what's currently loaded on screen.
  const exportParams = new URLSearchParams();
  if (categoryIds?.length) exportParams.set('categories', categoryIds.join(','));
  if (statuses?.length) exportParams.set('statuses', statuses.join(','));
  if (typeId !== undefined) exportParams.set('type', String(typeId));
  const exportHref = `/api/v1/items/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

  const [{ items, totalCount }, categories, types, settings] = await Promise.all([
    getItems({ categoryIds, statuses, typeId, limit: ITEMS_PAGE_SIZE, offset: 0 }),
    getCategories(),
    getTypes(),
    getSettings(),
  ]);

  const hasMore = items.length < totalCount;

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

          <SellModeControls sellModeActive={sellModeActive} saleId={saleId} />

          <ImportExcelButton />

          <a href={exportHref}>
            <Button style={{ background: 'var(--color-success)' }}>
              <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
              {t('exportExcel')}
            </Button>
          </a>
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

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <ItemsInfiniteGrid
          items={items}
          hasMore={hasMore}
          settings={settings}
          showDeleteButton
          sellMode={sellModeActive}
          saleId={saleId}
          categoryIds={categoryIds ?? []}
          statuses={statuses ?? []}
          typeId={typeId}
        />
      </div>
    </div>
  );
}
