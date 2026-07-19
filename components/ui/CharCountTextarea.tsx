// components/ui/CharCountTextarea.tsx
'use client';

import { useState } from 'react';

export function CharCountTextarea({
  name,
  defaultValue = '',
  maxLength,
  rows = 4,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  maxLength: number;
  rows?: number;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: 'var(--spacing-sm)',
          paddingBottom: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          fontFamily: 'inherit',
          fontSize: 'var(--font-size-base)',
          resize: 'vertical',
        }}
      />
      <span
        style={{
          position: 'absolute',
          right: 'var(--spacing-sm)',
          bottom: 'var(--spacing-xs)',
          fontSize: 'var(--font-size-sm)',
          color: value.length >= maxLength ? 'var(--color-danger)' : 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      >
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
