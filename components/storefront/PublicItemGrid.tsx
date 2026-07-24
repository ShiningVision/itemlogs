// components/storefront/PublicItemGrid.tsx
import { PublicItemCard } from './PublicItemCard';
import type { Settings } from '@/app/lib/definitions';

export function PublicItemGrid({
  items,
  settings,
  noItemsMessage,
  noImageLabel,
  density = 'dense',
}: {
  items: any[];
  settings: Settings;
  noItemsMessage: string;
  noImageLabel?: string;
  density?: 'dense' | 'showcase';
}) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)' }}>{noItemsMessage}</div>;
  }

  return (
    <div className={density === 'showcase' ? 'storefront-grid--showcase' : 'storefront-grid--dense'}>
      {items.map((item) => (
        <PublicItemCard key={item.id} item={item} settings={settings} noImageLabel={noImageLabel} />
      ))}
    </div>
  );
}
