// app/items/[id]/page.tsx
import { getItemById } from '@/app/lib/services/items';
import { getItemImages } from '@/app/lib/services/item-images';
import { getSettings } from '@/app/lib/services/settings';
import { resolveLabel } from '@/app/lib/labels';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { BackToStorefrontButton } from '@/components/storefront/BackToStorefrontButton';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StatBox } from '@/components/ui/StatBox';
import { Badge } from '@/components/ui/Badge';
import { ContactInquireButton } from '@/components/storefront/ContactInquireButton';
import { WhatsAppIcon } from '@/components/storefront/WhatsAppIcon';
import { TelegramIcon } from '@/components/storefront/TelegramIcon';
import { InstagramIcon } from '@/components/storefront/InstagramIcon';
import { EmailIcon } from '@/components/storefront/EmailIcon';
import { buildWhatsAppLink } from '@/app/lib/whatsapp';
import { buildTelegramLink } from '@/app/lib/telegram';
import { buildInstagramLink } from '@/app/lib/instagram';
import { buildEmailLink } from '@/app/lib/email';
import { ItemGallery } from '@/components/storefront/ItemGallery';

export default async function PublicItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, settings] = await Promise.all([
    getItemById(Number(id), { public: true }),
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

  // Each stat/section below now renders whenever its "show" setting is on,
  // regardless of whether the item actually has a value for it — an item
  // with no description, no location, or an unset price shows that field's
  // row empty rather than the row silently disappearing. Previously these
  // required a non-null value on top of the setting, which made a toggled-on
  // field flicker in and out of existence between items instead of behaving
  // like a fixed part of the page layout.
  const hasStats = settings.show_sell_price || settings.show_purchase_price || settings.show_cost_price;

  // On by default only for tenants set up after this feature shipped;
  // already-provisioned tenants default off, same as every other visibility
  // toggle.
  const showDescription = Boolean(settings.show_description);

  // Shared prefilled text for every channel that supports one (WhatsApp,
  // Telegram, and the email body — Instagram's DM link has no prefill
  // parameter at all, see app/lib/instagram.ts). Brand-agnostic wording on
  // purpose, so the same string works regardless of which button it ends
  // up behind.
  const inquiryMessage = t('inquiryMessage', {
    item: item.name ?? '',
    url: `${settings.app_url ?? ''}/items/${id}`,
  });

  return (
    <>
      {/* No packageFilter, and hideMenuButton — this page has no filter
          sidebar/drawer at all (there's nothing to filter on a single
          item), so neither the package dropdown nor the mobile hamburger
          trigger have anything to do here. logoLinksBack makes the logo act
          as the same "back to the grid you came from" action as the
          floating BackToStorefrontButton below. */}
      <StorefrontHeader hideMenuButton logoLinksBack />

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
                  <Badge>{categoryLabel}: {item.categories?.length ? item.categories.map((c: { name: string | null }) => c.name).join(', ') : itemsT('other')}</Badge>
                  <Badge>{typeLabel}: {item.types?.length ? item.types.map((t: { name: string | null }) => t.name).join(', ') : itemsT('other')}</Badge>
                </div>

                {hasStats && (
                  <div className="stat-grid">
                    {settings.show_sell_price && (
                      <StatBox
                        label={t('sellPrice')}
                        currency={settings.sell_currency?.currency_code ?? ''}
                        value={item.sell_price !== null ? item.sell_price.toFixed(2) : ''}
                      />
                    )}
                    {settings.show_purchase_price && (
                      <StatBox
                        label={t('purchasePrice')}
                        currency={item.purchase_currency?.currency_code ?? ''}
                        value={item.purchase_price !== null ? item.purchase_price.toFixed(2) : ''}
                      />
                    )}
                    {settings.show_cost_price && (
                      <StatBox
                        label={t('costPrice')}
                        currency={settings.sell_currency?.currency_code ?? ''}
                        value={item.cost_price !== null ? item.cost_price.toFixed(2) : ''}
                      />
                    )}
                  </div>
                )}

                {settings.show_contact &&
                  (settings.contact_whatsapp || settings.contact_telegram || settings.contact_instagram || settings.contact_email) && (
                    <div className="storefront-contact-buttons" style={{ marginTop: 'var(--spacing-md)' }}>
                      {/* Fixed order regardless of which channels a tenant
                          fills in, so the row doesn't visually reshuffle
                          from tenant to tenant. Each builder already
                          returns null for an empty field, and
                          ContactInquireButton renders nothing for a null
                          href — no per-channel presence check needed here
                          beyond the one above that decides whether to show
                          this block at all. */}
                      <ContactInquireButton
                        href={buildWhatsAppLink(settings.contact_whatsapp, inquiryMessage)}
                        icon={<WhatsAppIcon size={18} />}
                        label={t('inquireWhatsapp')}
                        brandColor="#25D366"
                      />
                      <ContactInquireButton
                        href={buildTelegramLink(settings.contact_telegram, inquiryMessage)}
                        icon={<TelegramIcon size={18} />}
                        label={t('inquireTelegram')}
                        brandColor="#26A5E4"
                      />
                      <ContactInquireButton
                        href={buildInstagramLink(settings.contact_instagram)}
                        icon={<InstagramIcon size={18} />}
                        label={t('inquireInstagram')}
                        brandColor="#D6249F"
                      />
                      <ContactInquireButton
                        href={buildEmailLink(settings.contact_email, t('inquireEmailSubject', { item: item.name ?? '' }), inquiryMessage)}
                        icon={<EmailIcon size={18} />}
                        label={t('inquireEmail')}
                        brandColor="#475569"
                      />
                    </div>
                  )}

                {/* Description/location used to render as full-width sections
                    below the whole header instead of inside this column —
                    that made the image and text columns end at mismatched
                    heights, which was a big part of why the page felt empty
                    on desktop. Living here now, they grow the right column
                    to actually match the (now much wider) image instead of
                    leaving it short. */}
                {showDescription && (
                  <div className="sheet-section" style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="sheet-section-title">{itemsT('description')}</div>
                    <p>{item.description ?? ''}</p>
                  </div>
                )}

                {settings.show_location && (
                  <div className="sheet-section" style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="sheet-section-title">{resolveLabel(settings.name_location, itemsT('location'))}</div>
                    <p>{item.location_ref?.name ?? ''}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <BackToStorefrontButton label={t('backToStorefront')} />
      </div>
    </>
  );
}
