// components/ui/Toggle.tsx
'use client';

export function Toggle({
  name,
  defaultChecked,
  disabled,
  label,
  onChange,
}: {
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="ios-toggle" aria-label={label}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
      <span className="ios-toggle-track" />
    </label>
  );
}
