// app/dashboard/(protected)/types/page.tsx
import { getTypes, getTypeItemCounts } from '@/app/lib/services/types';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { ReferenceDataManager } from '@/components/reference-data/ReferenceDataManager';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, paginateArray, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';

const TYPES_PAGE_SIZE = 50;

export default async function TypesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawSearchParams = await searchParams;
  const [types, itemCounts, settings] = await Promise.all([
    getTypes(),
    getTypeItemCounts(),
    getSettings(),
  ]);
  const t = await getTranslations('referenceData');
  const label = resolveLabel(settings.name_type, t('defaultTypeLabel'));

  const page = parsePage(rawSearchParams.page);
  const { pageItems, totalCount } = paginateArray(types, page, TYPES_PAGE_SIZE);
  const totalPages = getTotalPages(totalCount, TYPES_PAGE_SIZE);

  return (
    <ReferenceDataManager
      items={pageItems}
      itemCounts={itemCounts}
      apiPath="/api/v1/types"
      label={label}
      pagination={
        <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/types', rawSearchParams, p)} />
      }
    />
  );
}
