// components/ui/FilterPill.tsx
'use client';

export function FilterPill({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 'var(--radius-full)',
        border: 'none',
        padding: 'var(--spacing-xs) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: selected ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
        background: selected ? 'var(--color-primary)' : 'var(--color-surface)',
        color: selected ? '#fff' : 'var(--color-text)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background var(--motion-duration) var(--motion-easing)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
