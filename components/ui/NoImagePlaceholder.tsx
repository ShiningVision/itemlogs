// components/ui/NoImagePlaceholder.tsx
import { PhotoIcon } from '@heroicons/react/24/outline';

export function NoImagePlaceholder({ label }: { label?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-xs)',
        background: 'var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    >
      <PhotoIcon style={{ width: '32%', maxWidth: '48px', minWidth: '24px' }} />
      {label && <span style={{ fontSize: 'var(--font-size-sm)' }}>{label}</span>}
    </div>
  );
}
