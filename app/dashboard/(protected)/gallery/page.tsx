// app/dashboard/(protected)/gallery/page.tsx
import { getImages } from '@/app/lib/services/images';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage, getOffset, getTotalPages, buildPageHref } from '@/app/lib/pagination';
import { getTranslations } from 'next-intl/server';

const GALLERY_PAGE_SIZE = 40;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawSearchParams = await searchParams;
  const page = parsePage(rawSearchParams.page);
  const offset = getOffset(page, GALLERY_PAGE_SIZE);

  // already ordered newest first (id desc)
  const { images, totalCount } = await getImages({ limit: GALLERY_PAGE_SIZE, offset });
  const totalPages = getTotalPages(totalCount, GALLERY_PAGE_SIZE);
  const t = await getTranslations('gallery');

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <GalleryGrid initialImages={images} title={t('title')} />
      <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/dashboard/gallery', rawSearchParams, p)} />
    </div>
  );
}
