// components/ui/Badge.tsx
export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'primary';
}) {
  return (
    <span className={`sheet-badge${tone === 'primary' ? ' sheet-badge-primary' : ''}`}>
      {children}
    </span>
  );
}
