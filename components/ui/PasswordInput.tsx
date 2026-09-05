// components/ui/PasswordInput.tsx
'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// A plain <input type="password"> with a show/hide toggle — reveals the
// typed value as text rather than making the user retype it somewhere else
// to double-check for typos. The toggle button is absolutely positioned
// over the input's own padding box rather than changing the input's layout,
// so this drops into any existing password-field markup (setup wizard,
// login form, ...) without needing extra flex/grid wrapping at each call
// site beyond a `position: relative` wrapper, which this component provides
// itself.
//
// Everything besides className/toggleLabel/style just passes straight
// through to the underlying <input> (via ...inputProps) rather than being
// named individually — this component only actually cares about the type
// attribute, so it works equally well as a controlled input (SetupForm's
// value/onChange) or a plain uncontrolled one submitted via a form action
// (LoginForm's name="password", no React state at all).
export function PasswordInput({
  className,
  style,
  toggleLabel,
  ...inputProps
}: {
  className?: string;
  style?: React.CSSProperties;
  // Accessible label for the toggle button — no visible text of its own
  // (just the eye/eye-slash icon), so this only reaches screen readers.
  toggleLabel: { show: string; hide: string };
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'style'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ flex: 1, paddingRight: '2.25rem', ...style }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? toggleLabel.hide : toggleLabel.show}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        {visible ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
      </button>
    </div>
  );
}
