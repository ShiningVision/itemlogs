// widgets/Skeleton.tsx
//
// Shared building block for loading.tsx skeleton screens across the
// dashboard. A single shimmering block — pages compose these into rows,
// grids, and cards that roughly match the real layout underneath, so the
// loading state doesn't jump around once real content arrives.
export function Skeleton({
  width,
  height = '1em',
  radius = 'var(--radius-sm)',
  style,
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
