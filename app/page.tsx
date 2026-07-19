// app/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import {
  getPublicItems,
  getPublicItemsCount,
  getPublicCategoryCounts,
  getPublicTypeCounts,
  getFeaturedPublicItems,
} from '@/app/lib/services/items';
import { resolveLabel } from '@/app/lib/labels';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { FilterDrawerProvider } from '@/components/storefront/FilterDrawerContext';
import { StorefrontHero } from '@/components/storefront/StorefrontHero';
import { StorefrontSpotlight } from '@/components/storefront/StorefrontSpotlight';
import { FilterSidebar } from '@/components/storefront/FilterSidebar';
import { PublicItemGrid } from '@/components/storefront/PublicItemGrid';
import { DensityToggle } from '@/components/storefront/DensityToggle';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

const PUBLIC_ITEMS_PAGE_SIZE = 24;

type SearchParams = {
  categories?: string;
  types?: string;
  statuses?: string;
  page?: string;
  density?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const { categories: categoriesParam, types: typesParam, statuses: statusesParam, page: pageParam, density: densityParam } = rawSearchParams;
  const settings = await getSettings();

  if (!settings.show) {
    redirect('/login');
  }

  const t = await getTranslations('storefront');
  const itemsT = await getTranslations('items');

  const statusFlags: Record<number, boolean> = {
    1: settings.show_status_1,
    2: settings.show_status_2,
    3: settings.show_status_3,
    4: settings.show_status_4,
  };
  const allowedStatuses = [1, 2, 3, 4].filter((s) => statusFlags[s]);
  const statusOptionLabels = Object.fromEntries(allowedStatuses.map((s) => [s, itemsT(`status${s}`)]));

  const categoryLabel = resolveLabel(settings.name_category, itemsT('category'));
  const typeLabel = resolveLabel(settings.name_type, itemsT('type'));
  const statusLabel = resolveLabel(settings.name_status, itemsT('filterStatuses'));

  const selectedCategoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : [];
  const selectedTypeIds = typesParam ? typesParam.split(',').map(Number) : [];
  const selectedStatuses = statusesParam ? statusesParam.split(',').map(Number) : [];

  const density: 'dense' | 'showcase' =
    densityParam === 'showcase' || densityParam === 'dense'
      ? densityParam
      : settings.storefront_density === 'showcase'
        ? 'showcase'
        : 'dense';

  const page = parsePage(pageParam);
  const offset = getOffset(page, PUBLIC_ITEMS_PAGE_SIZE);

  const [{ items, totalCount }, categories, types, collectionItemCount, categoryCounts, typeCounts, featuredItems] =
    await Promise.all([
      getPublicItems(
        {
          categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
          typeIds: selectedTypeIds.length ? selectedTypeIds : undefined,
          statuses: selectedStatuses.length ? selectedStatuses : undefined,
          limit: PUBLIC_ITEMS_PAGE_SIZE,
          offset,
        },
        allowedStatuses
      ),
      getCategories(),
      getTypes(),
      getPublicItemsCount(allowedStatuses),
      getPublicCategoryCounts(allowedStatuses),
      getPublicTypeCounts(allowedStatuses),
      getFeaturedPublicItems(allowedStatuses),
    ]);

  const totalPages = getTotalPages(totalCount, PUBLIC_ITEMS_PAGE_SIZE);

  const sortedCategories = [...categories].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  const sortedTypes = [...types].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  const noFiltersActive = selectedCategoryIds.length === 0 && selectedTypeIds.length === 0 && selectedStatuses.length === 0;

  return (
    <FilterDrawerProvider>
      <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
      <StorefrontHeader />

      <StorefrontHero
        name={settings.storefront_name}
        tagline={settings.storefront_tagline}
        itemCount={collectionItemCount}
        categoryCount={categories.length}
        fallbackName={t('defaultCollectionName')}
        itemCountLabel={t('collectionStats', { itemCount: collectionItemCount, categoryCount: categories.length })}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <FilterSidebar
          categories={sortedCategories}
          types={sortedTypes}
          selectedCategoryIds={selectedCategoryIds}
          selectedTypeIds={selectedTypeIds}
          availableStatuses={allowedStatuses}
          selectedStatuses={selectedStatuses}
          categoryLabel={categoryLabel}
          typeLabel={typeLabel}
          statusLabel={statusLabel}
          statusOptionLabels={statusOptionLabels}
          categoryCounts={categoryCounts}
          typeCounts={typeCounts}
        />

        <main className="storefront-main" style={{ flex: 1, minWidth: 0 }}>
          {settings.show_message && (
            <div
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                whiteSpace: 'pre-line',
              }}
            >
              {settings.show_message}
            </div>
          )}

          {noFiltersActive && page === 1 && (
            <StorefrontSpotlight
              items={featuredItems}
              settings={settings}
              title={t('featured')}
              noImageLabel={t('noImage')}
            />
          )}

          <div className="storefront-toolbar">
            <span className="storefront-result-count">{t('resultCount', { count: totalCount })}</span>
            <DensityToggle density={density} />
          </div>

          <PublicItemGrid items={items} settings={settings} noItemsMessage={t('noItems')} noImageLabel={t('noImage')} density={density} />

          <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/', rawSearchParams, p)} />
        </main>
      </div>

      {settings.show_contact && settings.contact_info && (
        <footer className="storefront-footer">
          {t('footerContact', { contact: settings.contact_info })}
        </footer>
      )}
      </div>
    </FilterDrawerProvider>
  );
}
