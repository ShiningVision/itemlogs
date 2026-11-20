// app/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getCategories } from '@/app/lib/services/categories';
import { getTypes } from '@/app/lib/services/types';
import { typesEnabled } from '@/app/lib/typesEnabled';
import { locationsEnabled } from '@/app/lib/locationsEnabled';
import { groupIdenticalItems } from '@/app/lib/groupIdentical';
import { parseIdList } from '@/app/lib/idList';
import { getLocations } from '@/app/lib/services/locations';
import { getPublicPackages } from '@/app/lib/services/packages';
import {
  getPublicItems,
  getPublicItemsCount,
  getPublicCategoryCounts,
  getPublicTypeCounts,
  getPublicLocationCounts,
  getFeaturedPublicItems,
  OTHER_FILTER_ID,
  type ItemSort,
} from '@/app/lib/services/items';
import { resolveLabel } from '@/app/lib/labels';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { FilterDrawerProvider } from '@/components/storefront/FilterDrawerContext';
import { StorefrontHero } from '@/components/storefront/StorefrontHero';
import { StorefrontSpotlight } from '@/components/storefront/StorefrontSpotlight';
import { FilterSidebar } from '@/components/storefront/FilterSidebar';
import { SelectedFiltersRow, type SelectedFilterChip } from '@/components/storefront/SelectedFiltersRow';
import { PackageFilterDropdown } from '@/components/storefront/PackageFilterDropdown';
import { StorefrontSearchBar } from '@/components/storefront/StorefrontSearchBar';
import { PublicItemGrid } from '@/components/storefront/PublicItemGrid';
import { DensityToggle } from '@/components/storefront/DensityToggle';
import { SortSelect } from '@/components/ui/SortSelect';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { isUnprovisionedTenantError } from '@/app/lib/errors/isUnprovisionedTenantError';
import { ServiceUnavailable } from '@/components/ui/ServiceUnavailable';

const PUBLIC_ITEMS_PAGE_SIZE = 24;

type SearchParams = {
  categories?: string;
  types?: string;
  locations?: string;
  // Excluded tags — the tag filters' third state (see app/lib/idList.ts).
  xcategories?: string;
  xtypes?: string;
  xlocations?: string;
  statuses?: string;
  package?: string;
  page?: string;
  density?: string;
  sort?: string;
  search?: string;
};

const VALID_SORTS: ItemSort[] = ['newest', 'oldest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const { categories: categoriesParam, types: typesParam, locations: locationsParam, xcategories: xcategoriesParam, xtypes: xtypesParam, xlocations: xlocationsParam, statuses: statusesParam, package: packageParam, page: pageParam, density: densityParam, sort: sortParam, search: searchParam } = rawSearchParams;

  // On a freshly provisioned tenant, the database has no tables yet — the
  // Supabase Marketplace resource creates an empty Postgres instance, and
  // nothing has run schema creation/seeding against it. getSettings() then
  // throws a raw PostgREST "relation does not exist" error straight up to
  // Next's default error page, which is meaningless to a first-time tenant.
  // Route them to /setup instead, which creates the schema, seeds starter
  // data, and collects the handful of choices (password, language, default
  // currency, etc.) that used to live in the placeholder settings row.
  //
  // But getSettings() also throws for reasons that have nothing to do with
  // "hasn't run setup yet" — e.g. the Supabase project itself got
  // paused/banned after a tenant had already been running for a while
  // (seen in the wild: Supabase flagging a project created via a
  // disposable email used during the Vercel integration). Blindly
  // redirecting to /setup in that case is actively misleading — it looks
  // like the normal first-run wizard, gives no indication anything is
  // actually wrong, and resubmitting it just fails again against the same
  // broken backend. isUnprovisionedTenantError narrows this down to only
  // the "table genuinely doesn't exist" case; anything else gets its own
  // explanation instead.
  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    settings = await getSettings();
  } catch (error) {
    if (isUnprovisionedTenantError(error)) {
      redirect('/setup');
    }
    const t = await getTranslations('serviceUnavailable');
    return <ServiceUnavailable title={t('title')} message={t('message')} />;
  }

  if (!settings.show) {
    redirect('/login');
  }

  const t = await getTranslations('storefront');
  const itemsT = await getTranslations('items');

  // "Status" itself is not tenant-renameable — name_status instead holds
  // the tenant-chosen name for the 5th status option (falls back to the
  // "status5" translation, "Undefined", when blank).
  const status5Label = resolveLabel(settings.name_status, itemsT('status5'));
  const statusFlags: Record<number, boolean> = {
    1: settings.show_status_1,
    2: settings.show_status_2,
    3: settings.show_status_3,
    4: settings.show_status_4,
    5: settings.show_status_5,
  };
  const allowedStatuses = [1, 2, 3, 4, 5].filter((s) => statusFlags[s]);
  const statusOptionLabels = Object.fromEntries(
    allowedStatuses.map((s) => [s, s === 5 ? status5Label : itemsT(`status${s}`)])
  );

  const categoryLabel = resolveLabel(settings.name_category, itemsT('category'));
  const typeLabel = resolveLabel(settings.name_type, itemsT('type'));
  const locationLabel = resolveLabel(settings.name_location, itemsT('location'));
  const statusLabel = itemsT('filterStatuses');
  const packageLabel = resolveLabel(settings.name_package, itemsT('package'));

  const selectedCategoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : [];
  // Types turned off (see typesEnabled): a leftover `types` URL param must
  // not keep filtering with no visible filter or chip to explain it.
  const selectedTypeIds = typesEnabled(settings) && typesParam ? typesParam.split(',').map(Number) : [];
  // The location filter is off with locations turned off (locationsEnabled)
  // or its own visitor toggle off — leftover URL params must not filter
  // invisibly.
  const locationFilterOn = locationsEnabled(settings) && settings.show_location_filter;
  const selectedLocationIds = locationFilterOn && locationsParam ? locationsParam.split(',').map(Number) : [];
  const excludedCategoryIds = parseIdList(xcategoriesParam);
  const excludedTypeIds = typesEnabled(settings) ? parseIdList(xtypesParam) : [];
  // Like the location section itself, only honored while the location
  // filter is on (a leftover param must not filter invisibly).
  const excludedLocationIds = locationFilterOn ? parseIdList(xlocationsParam) : [];
  const selectedStatuses = statusesParam ? statusesParam.split(',').map(Number) : [];
  const selectedPackageId = packageParam ? Number(packageParam) : null;
  // Trimmed here for the same "empty means no search" reason as the
  // dashboard items page; the actual length cap against abuse lives
  // server-side in resolveSearchItemIds (see app/lib/services/items.ts) so
  // it applies no matter how the param got here.
  const search = searchParam?.trim() || undefined;

  const density: 'dense' | 'showcase' =
    densityParam === 'showcase' || densityParam === 'dense'
      ? densityParam
      : settings.storefront_density === 'showcase'
        ? 'showcase'
        : 'dense';

  const sort: ItemSort = VALID_SORTS.includes(sortParam as ItemSort) ? (sortParam as ItemSort) : 'newest';

  const page = parsePage(pageParam);
  const offset = getOffset(page, PUBLIC_ITEMS_PAGE_SIZE);

  const groupIdentical = groupIdenticalItems(settings);

  const [{ items, totalCount }, categories, types, locations, collectionItemCount, categoryCounts, typeCounts, locationCounts, featuredItems, publicPackages] =
    await Promise.all([
      getPublicItems(
        {
          categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
          typeIds: selectedTypeIds.length ? selectedTypeIds : undefined,
          locationIds: selectedLocationIds.length ? selectedLocationIds : undefined,
          excludeCategoryIds: excludedCategoryIds,
          excludeTypeIds: excludedTypeIds,
          excludeLocationIds: excludedLocationIds,
          statuses: selectedStatuses.length ? selectedStatuses : undefined,
          packageId: selectedPackageId ?? undefined,
          search,
          sort,
          limit: PUBLIC_ITEMS_PAGE_SIZE,
          offset,
        },
        allowedStatuses,
        groupIdentical
      ),
      getCategories(),
      typesEnabled(settings) ? getTypes() : Promise.resolve([]),
      locationFilterOn ? getLocations() : Promise.resolve([]),
      getPublicItemsCount(allowedStatuses, groupIdentical),
      getPublicCategoryCounts(allowedStatuses, groupIdentical),
      typesEnabled(settings) ? getPublicTypeCounts(allowedStatuses, groupIdentical) : Promise.resolve({} as Record<number, number>),
      locationFilterOn ? getPublicLocationCounts(allowedStatuses, groupIdentical) : Promise.resolve({}),
      settings.show_featured_items ? getFeaturedPublicItems(allowedStatuses, groupIdentical) : Promise.resolve([]),
      settings.show_package_filter ? getPublicPackages() : Promise.resolve([]),
    ]);

  const totalPages = getTotalPages(totalCount, PUBLIC_ITEMS_PAGE_SIZE);

  const sortedCategories = [...categories].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  const sortedTypes = [...types].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  const sortedLocations = [...locations].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  // "Other" isn't a real row (see app/lib/placeholder-data.ts) — it's how a
  // null category/type is interpreted app-wide. Appended after sorting so
  // it always lands last, and only shown as a filter option when at least
  // one visible item actually has no category/type to bucket under it.
  const otherLabel = itemsT('other');
  if ((categoryCounts[OTHER_FILTER_ID] ?? 0) > 0) {
    sortedCategories.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }
  if ((typeCounts[OTHER_FILTER_ID] ?? 0) > 0) {
    sortedTypes.push({ id: OTHER_FILTER_ID, name: otherLabel });
  }

  const noFiltersActive =
    selectedCategoryIds.length === 0 &&
    selectedTypeIds.length === 0 &&
    selectedLocationIds.length === 0 &&
    excludedCategoryIds.length === 0 &&
    excludedTypeIds.length === 0 &&
    excludedLocationIds.length === 0 &&
    selectedStatuses.length === 0 &&
    selectedPackageId === null &&
    !search;

  // Feeds SelectedFiltersRow — one chip per currently active category/type/
  // location/status selection, built from the same *label lookup lists
  // (sortedCategories/etc.) and selected*Ids arrays FilterSidebar already
  // uses, so a chip's text always matches what the sidebar shows for it.
  // Locations only included when the location filter is actually on,
  // mirroring FilterSidebar's own locationFilter gating.
  const selectedFilterChips: SelectedFilterChip[] = [
    ...selectedCategoryIds.map((id) => ({
      dimension: 'categories' as const,
      id,
      label: sortedCategories.find((c) => c.id === id)?.name ?? '',
    })),
    ...selectedTypeIds.map((id) => ({
      dimension: 'types' as const,
      id,
      label: sortedTypes.find((t2) => t2.id === id)?.name ?? '',
    })),
    ...(locationFilterOn
      ? selectedLocationIds.map((id) => ({
          dimension: 'locations' as const,
          id,
          label: sortedLocations.find((l) => l.id === id)?.name ?? '',
        }))
      : []),
    ...selectedStatuses.map((id) => ({
      dimension: 'statuses' as const,
      id,
      label: statusOptionLabels[id] ?? '',
    })),
    // Excluded tags get their own (struck-through) chips, after the
    // included ones.
    ...excludedCategoryIds.map((id) => ({
      dimension: 'categories' as const,
      id,
      label: sortedCategories.find((c) => c.id === id)?.name ?? '',
      excluded: true,
    })),
    ...excludedTypeIds.map((id) => ({
      dimension: 'types' as const,
      id,
      label: sortedTypes.find((t2) => t2.id === id)?.name ?? '',
      excluded: true,
    })),
    ...(locationFilterOn
      ? excludedLocationIds.map((id) => ({
          dimension: 'locations' as const,
          id,
          label: sortedLocations.find((l) => l.id === id)?.name ?? '',
          excluded: true,
        }))
      : []),
  ];

  const packageFilterDropdown = settings.show_package_filter ? (
    <PackageFilterDropdown
      packages={publicPackages}
      selectedPackageId={selectedPackageId}
      label={packageLabel}
    />
  ) : null;

  // Two separate mount points, each with props suited to its own context —
  // same "rendered twice, CSS picks which is visible" pattern already used
  // for packageFilterDropdown above, just with different props per mount
  // instead of the identical element in both places: mobile (header, next
  // to the filter icon) stays collapsed to an icon until tapped, while
  // desktop (inside the filter sidebar itself, see FilterSidebar's
  // searchBar prop — not a separate row, so it reads as part of that same
  // bordered column instead of floating above it) always shows the full
  // field.
  const mobileSearchBar = <StorefrontSearchBar search={search ?? ''} />;
  const desktopSearchBar = <StorefrontSearchBar search={search ?? ''} alwaysExpanded />;

  return (
    <FilterDrawerProvider>
      <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
      <StorefrontHeader packageFilter={packageFilterDropdown} searchBar={mobileSearchBar} />

      <StorefrontHero
        name={settings.storefront_name}
        tagline={settings.storefront_tagline}
        itemCount={collectionItemCount}
        fallbackName={t('defaultCollectionName')}
        itemCountLabel={t('collectionStats', { itemCount: collectionItemCount })}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <FilterSidebar
          searchBar={desktopSearchBar}
          categories={sortedCategories}
          types={sortedTypes}
          locations={sortedLocations}
          selectedCategoryIds={selectedCategoryIds}
          selectedTypeIds={selectedTypeIds}
          selectedLocationIds={selectedLocationIds}
          excludedCategoryIds={excludedCategoryIds}
          excludedTypeIds={excludedTypeIds}
          excludedLocationIds={excludedLocationIds}
          availableStatuses={allowedStatuses}
          selectedStatuses={selectedStatuses}
          categoryLabel={categoryLabel}
          typeLabel={typeLabel}
          locationLabel={locationLabel}
          statusLabel={statusLabel}
          statusOptionLabels={statusOptionLabels}
          categoryCounts={categoryCounts}
          typeCounts={typeCounts}
          showTypes={typesEnabled(settings)}
          locationCounts={locationCounts}
          packageFilter={packageFilterDropdown}
          locationFilter={locationFilterOn}
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

          <SelectedFiltersRow chips={selectedFilterChips} />

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
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
              <DensityToggle density={density} />
            </div>
          </div>

          <PublicItemGrid items={items} settings={settings} noItemsMessage={search ? t('noSearchResults') : t('noItems')} noImageLabel={t('noImage')} density={density} />

          <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/', rawSearchParams, p)} />
        </main>
      </div>
      </div>
    </FilterDrawerProvider>
  );
}
