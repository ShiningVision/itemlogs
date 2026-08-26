// app/dashboard/(protected)/gallery/page.tsx
import { getImages, getReferencedImageIds } from '@/app/lib/services/images';
import { getDocuments } from '@/app/lib/services/documents';
import { getBlobUsage, BLOB_LIMIT_BYTES } from '@/app/lib/storage/blob-usage';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { getTranslations } from 'next-intl/server';

export default async function GalleryPage() {
  // The Gallery now does its own sorting/filtering/pagination client-side
  // (sort-by-size and orphan-filtering both need the full set to work with),
  // so we fetch every image/document once rather than a DB-paginated page.
  const [{ images }, referencedIds, documents, usage] = await Promise.all([
    getImages(),
    getReferencedImageIds(),
    getDocuments(),
    getBlobUsage(),
  ]);

  const sizeByUrl = Object.fromEntries(usage.sizeByUrl);
  const orphanIds = images.filter((img) => !referencedIds.has(img.id)).map((img) => img.id);
  const t = await getTranslations('gallery');

  return (
    <div className="page-container-wide" style={{ padding: 'var(--spacing-lg)' }}>
      <GalleryGrid
        initialImages={images}
        initialDocuments={documents}
        title={t('title')}
        sizeByUrl={sizeByUrl}
        orphanIds={orphanIds}
        imagesBytes={usage.imagesBytes}
        documentsBytes={usage.documentsBytes}
        limitBytes={BLOB_LIMIT_BYTES}
      />
    </div>
  );
}
