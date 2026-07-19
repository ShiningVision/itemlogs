// components/storefront/StorefrontSpotlight.tsx
import { PublicItemCard } from './PublicItemCard';
import type { Settings } from '@/app/lib/definitions';

export function StorefrontSpotlight({
  items,
  settings,
  title,
  noImageLabel,
}: {
  items: any[];
  settings: Settings;
  title: string;
  noImageLabel?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="storefront-spotlight">
      <div className="storefront-spotlight-title">{title}</div>
      <div className="storefront-spotlight-row">
        {items.map((item) => (
          <PublicItemCard key={item.id} item={item} settings={settings} noImageLabel={noImageLabel} />
        ))}
      </div>
    </div>
  );
}
