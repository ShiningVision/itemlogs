// widgets/Button/Button.default.tsx
export function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  style,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'var(--color-primary)',
        color: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontWeight: 600,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}