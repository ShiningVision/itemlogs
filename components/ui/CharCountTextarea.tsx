// components/ui/CharCountTextarea.tsx
'use client';

import { useState } from 'react';

// Two usage modes:
//  - Uncontrolled (SettingsForm's visitor page message): pass `defaultValue`
//    and a `name` for the surrounding <form>'s own FormData submit — value
//    lives entirely in this component's own state.
//  - Controlled (ItemForm's description/notes): pass `value` + `onChange`
//    instead — ItemForm keeps all its fields in one state object and posts
//    a JSON payload itself, so the textarea's value has to come from (and
//    report back to) the parent rather than being owned here.
// `maxLength` is optional — when omitted (see ItemForm's notes field, an
// unbounded TEXT column), the count still shows live but nothing is
// truncated and there's no "/max" denominator.
export function CharCountTextarea({
  name,
  value,
  defaultValue = '',
  onChange,
  onBlur,
  maxLength,
  rows = 4,
  placeholder,
  className,
  minHeight,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  // Save-on-blur mode (SettingsForm's visitor page message) — optional
  // since the uncontrolled/ItemForm usages above don't need it.
  onBlur?: () => void;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  // When set, the textarea is styled via this class (e.g. the item form's
  // shared "sheet-input" look) instead of this component's own inline
  // defaults — keeps it visually consistent with whichever form it's
  // dropped into rather than always looking like the settings page.
  className?: string;
  minHeight?: string;
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = maxLength !== undefined ? e.target.value.slice(0, maxLength) : e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        name={name}
        value={currentValue}
        onChange={handleChange}
        onBlur={onBlur}
        maxLength={maxLength}
        rows={className ? undefined : rows}
        placeholder={placeholder}
        className={className}
        style={
          className
            ? { width: '100%', minHeight, paddingBottom: 'var(--spacing-lg)', resize: 'vertical' }
            : {
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
              }
        }
      />
      <span
        style={{
          position: 'absolute',
          right: 'var(--spacing-sm)',
          bottom: 'var(--spacing-xs)',
          fontSize: 'var(--font-size-sm)',
          color: maxLength !== undefined && currentValue.length >= maxLength ? 'var(--color-danger)' : 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      >
        {maxLength !== undefined ? `${currentValue.length}/${maxLength}` : currentValue.length}
      </span>
    </div>
  );
}
