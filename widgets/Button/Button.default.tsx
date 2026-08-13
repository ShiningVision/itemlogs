// widgets/Button/Button.default.tsx
import { Tooltip } from '@/components/ui/Tooltip';

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
  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
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

  // `title` used to fall straight through to the native button attribute
  // (plain browser tooltip). Routing it through Tooltip instead gives every
  // existing <Button title="..."> call site the speech-bubble style for
  // free, with no changes needed at each call site.
  return title ? <Tooltip text={title}>{button}</Tooltip> : button;
}