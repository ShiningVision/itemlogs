// components/items/ItemGrid.tsx
import { ItemCard } from './ItemCard';
import type { Settings } from '@/app/lib/definitions';

export function ItemGrid({
  items,
  settings,
  showDeleteButton = false,
  sellMode = false,
  saleId,
  removeFromPackageButton = false,
  onItemRemovedFromPackage,
  removeFromSaleButton = false,
  onItemRemovedFromSale,
  density = 'dense',
}: {
  items: any[];
  settings: Settings;
  showDeleteButton?: boolean;
  sellMode?: boolean;
  saleId?: number;
  removeFromPackageButton?: boolean;
  onItemRemovedFromPackage?: () => void;
  removeFromSaleButton?: boolean;
  onItemRemovedFromSale?: () => void;
  // Reuses the same dense/showcase grid CSS the public storefront grid
  // uses (see .storefront-grid--dense/--showcase in globals.css) — it's a
  // plain column-count/gap variant, not actually storefront-specific.
  density?: 'dense' | 'showcase';
}) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)' }}>No items match these filters.</div>;
  }

  return (
    <div className={density === 'showcase' ? 'storefront-grid--showcase' : 'storefront-grid--dense'}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          settings={settings}
          showDeleteButton={showDeleteButton}
          sellMode={sellMode}
          saleId={saleId}
          removeFromPackageButton={removeFromPackageButton}
          onRemovedFromPackage={onItemRemovedFromPackage}
          removeFromSaleButton={removeFromSaleButton}
          onRemovedFromSale={onItemRemovedFromSale}
        />
      ))}
    </div>
  );
}