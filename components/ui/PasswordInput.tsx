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
export function PasswordInput({
  value,
  onChange,
  onKeyDown,
  autoFocus,
  className,
  toggleLabel,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  // Passed straight through to the <input> so call sites keep their
  // existing styling (e.g. "setup-wizard-input") unchanged.
  className?: string;
  // Accessible label for the toggle button — no visible text of its own
  // (just the eye/eye-slash icon), so this only reaches screen readers.
  toggleLabel: { show: string; hide: string };
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        className={className}
        style={{ flex: 1, paddingRight: '2.25rem' }}
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
