// app/items/[id]/page.tsx
import { getItemById } from '@/app/lib/services/items';
import { getItemImages } from '@/app/lib/services/item-images';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { BackToStorefrontButton } from '@/components/storefront/BackToStorefrontButton';
import { StatBox } from '@/components/ui/StatBox';
import { Badge } from '@/components/ui/Badge';
import { ContactModal } from '@/components/storefront/ContactModal';
import { ItemGallery } from '@/components/storefront/ItemGallery';

export default async function PublicItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, settings] = await Promise.all([
    getItemById(Number(id)),
    getSettings(),
  ]);

  const statusFlags: Record<number, boolean> = {
    1: settings.show_status_1,
    2: settings.show_status_2,
    3: settings.show_status_3,
    4: settings.show_status_4,
  };

  if (!settings.show) {
    redirect('/login');
  }

  if (!statusFlags[item.status]) {
    notFound();
  }

  const galleryImages = await getItemImages(Number(id));
  const t = await getTranslations('storefront');
  const itemsT = await getTranslations('items');

  const categoryLabel = resolveLabel(settings.name_category, itemsT('category'));
  const typeLabel = resolveLabel(settings.name_type, itemsT('type'));

  const hasStats =
    (settings.show_sell_price && item.sell_price !== null) ||
    (settings.show_purchase_price && item.purchase_price !== null) ||
    (settings.show_cost_price && item.cost_price !== null);

  return (
    <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)' }}>
      <div className="sheet-frame">
        <div className="sheet-body">
          <div className="sheet-header">
            <div className="sheet-portrait">
              <ItemGallery
                mainImage={
                  item.main_image_ref?.url
                    ? { id: item.main_image ?? -1, url: item.main_image_ref.url }
                    : null
                }
                galleryImages={galleryImages.map((gi) => ({ id: gi.image_id, url: gi.images.url }))}
                itemName={item.name ?? ''}
                noImageLabel={t('noImage')}
              />
            </div>

            <div className="sheet-title-block">
              <h1 className="sheet-name">{item.name}</h1>

              <div className="sheet-badges">
                <Badge tone="primary">{itemsT(`status${item.status}`)}</Badge>
                <Badge>{categoryLabel}: {item.category_ref?.name ?? itemsT('other')}</Badge>
                <Badge>{typeLabel}: {item.type_ref?.name ?? itemsT('other')}</Badge>
              </div>

              {hasStats && (
                <div className="stat-grid">
                  {settings.show_sell_price && item.sell_price !== null && (
                    <StatBox
                      label={t('sellPrice')}
                      currency={settings.sell_currency?.currency_code ?? ''}
                      value={item.sell_price.toFixed(2)}
                    />
                  )}
                  {settings.show_purchase_price && item.purchase_price !== null && (
                    <StatBox
                      label={t('purchasePrice')}
                      currency={item.purchase_currency?.currency_code ?? ''}
                      value={item.purchase_price.toFixed(2)}
                    />
                  )}
                  {settings.show_cost_price && item.cost_price !== null && (
                    <StatBox
                      label={t('costPrice')}
                      currency={settings.sell_currency?.currency_code ?? ''}
                      value={item.cost_price.toFixed(2)}
                    />
                  )}
                </div>
              )}

              {settings.show_contact && settings.contact_info && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <ContactModal contactInfo={settings.contact_info} itemName={item.name ?? ''} />
                </div>
              )}
            </div>
          </div>

          {item.description && (
            <div className="sheet-section">
              <div className="sheet-section-title">{itemsT('description')}</div>
              <p>{item.description}</p>
            </div>
          )}

          {settings.show_location && item.location && (
            <div className="sheet-section">
              <div className="sheet-section-title">{itemsT('location')}</div>
              <p>{item.location}</p>
            </div>
          )}
        </div>
      </div>

      <BackToStorefrontButton label={t('backToStorefront')} />
    </div>
  );
}
