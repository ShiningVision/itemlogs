// components/storefront/StorefrontHero.tsx
export function StorefrontHero({
  name,
  tagline,
  itemCount,
  fallbackName,
  itemCountLabel,
}: {
  name: string | null;
  tagline: string | null;
  itemCount: number;
  fallbackName: string;
  itemCountLabel: string;
}) {
  return (
    <div className="storefront-hero">
      <h1 className="storefront-hero-name">{name || fallbackName}</h1>
      {tagline && <p className="storefront-hero-tagline">{tagline}</p>}
      {itemCount > 0 && (
        <p className="storefront-hero-stats">
          {itemCountLabel}
        </p>
      )}
    </div>
  );
}
