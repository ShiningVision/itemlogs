// components/storefront/PublicItemCard.tsx
import Link from 'next/link';
import type { Settings } from '@/app/lib/definitions';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';

type PublicItem = {
  id: number;
  name: string | null;
  sell_price: number | null;
  purchase_price: number | null;
  cost_price: number | null;
  main_image_ref: { url: string } | null;
  purchase_currency: { currency_code: string; currency_symbol: string } | null;
};

export function PublicItemCard({
  item,
  settings,
  noImageLabel,
}: {
  item: PublicItem;
  settings: Settings;
  noImageLabel?: string;
}) {
  const headlinePrice =
    settings.show_sell_price && item.sell_price !== null
      ? `${settings.sell_currency?.currency_symbol ?? ''}${item.sell_price.toFixed(2)}`
      : null;

  const hasOtherPrices =
    (settings.show_purchase_price && item.purchase_price !== null) ||
    (settings.show_cost_price && item.cost_price !== null);

  return (
    <Link href={`/items/${item.id}`} className="catalog-card interactive-card">
      <div className="catalog-card-art">
        {item.main_image_ref?.url ? (
          <img
            src={item.main_image_ref.url}
            alt={item.name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <NoImagePlaceholder label={noImageLabel} />
        )}
        {headlinePrice && <span className="catalog-card-price-tag">{headlinePrice}</span>}
      </div>

      <div className="catalog-card-body">
        <span className="catalog-card-name">{item.name}</span>

        {hasOtherPrices && (
          <div className="catalog-card-prices">
            {settings.show_purchase_price && item.purchase_price !== null && (
              <span>{item.purchase_currency?.currency_symbol}{item.purchase_price.toFixed(2)}</span>
            )}
            {settings.show_cost_price && item.cost_price !== null && (
              <span>{settings.sell_currency?.currency_symbol}{item.cost_price.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
