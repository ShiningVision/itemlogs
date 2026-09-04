// components/items/ItemGrid.tsx
import { ItemCard } from './ItemCard';
import type { Settings } from '@/app/lib/definitions';

export function ItemGrid({
  items,
  settings,
  showDeleteButton = false,
  saleId,
  removeFromPackageButton = false,
  onItemRemovedFromPackage,
  removeFromSaleButton = false,
  onItemRemovedFromSale,
  density = 'dense',
  selectable = false,
  selectedIds,
  onToggleSelect,
}: {
  items: any[];
  settings: Settings;
  showDeleteButton?: boolean;
  saleId?: number;
  removeFromPackageButton?: boolean;
  onItemRemovedFromPackage?: () => void;
  removeFromSaleButton?: boolean;
  onItemRemovedFromSale?: () => void;
  // dense/showcase reuse the same grid CSS the public storefront grid uses
  // (see .storefront-grid--dense/--showcase in globals.css) — it's a plain
  // column-count/gap variant, not actually storefront-specific. 'compact'
  // is dashboard-only (see .item-grid--compact): a fixed 3-per-row grid
  // with a shorter image area, for browsing the items list on a phone.
  density?: 'dense' | 'showcase' | 'compact';
  // See ItemCard's own selectable/onToggleSelect comment — used by the
  // sell-items picker (components/sales/SellPicker.tsx).
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (item: any) => void;
}) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)' }}>No items match these filters.</div>;
  }

  const gridClassName =
    density === 'showcase' ? 'storefront-grid--showcase' : density === 'compact' ? 'item-grid--compact' : 'storefront-grid--dense';

  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          settings={settings}
          showDeleteButton={showDeleteButton}
          saleId={saleId}
          removeFromPackageButton={removeFromPackageButton}
          onRemovedFromPackage={onItemRemovedFromPackage}
          removeFromSaleButton={removeFromSaleButton}
          onRemovedFromSale={onItemRemovedFromSale}
          compact={density === 'compact'}
          selectable={selectable}
          selected={selectedIds?.has(item.id) ?? false}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}