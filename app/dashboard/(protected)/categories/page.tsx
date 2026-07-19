// app/dashboard/(protected)/categories/page.tsx

import { getCategories, getCategoryItemCounts } from '@/app/lib/services/categories';
import { ReferenceDataManager } from '@/components/reference-data/ReferenceDataManager';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, paginateArray, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';

const CATEGORIES_PAGE_SIZE = 50;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawSearchParams = await searchParams;
  const [categories, itemCounts, settings] = await Promise.all([
    getCategories(),
    getCategoryItemCounts(),
    getSettings(),
  ]);
  const t = await getTranslations('referenceData');
  const label = resolveLabel(settings.name_category, t('defaultCategoryLabel'));

  const page = parsePage(rawSearchParams.page);
  const { pageItems, totalCount } = paginateArray(categories, page, CATEGORIES_PAGE_SIZE);
  const totalPages = getTotalPages(totalCount, CATEGORIES_PAGE_SIZE);

  return (
    <ReferenceDataManager
      items={pageItems}
      itemCounts={itemCounts}
      apiPath="/api/v1/categories"
      label={label}
      pagination={
        <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/categories', rawSearchParams, p)} />
      }
    />
  );
}
