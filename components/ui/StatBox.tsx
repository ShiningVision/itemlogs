// components/ui/StatBox.tsx
// Read-only "ability score" style stat block for the character-sheet item views.
export function StatBox({
  label,
  value,
  currency,
}: {
  label: string;
  value: React.ReactNode;
  // Optional currency code (e.g. "USD"), rendered as a small header directly
  // above the price value instead of appended inline after the number.
  currency?: string;
}) {
  return (
    <div className="stat-box">
      <span className="stat-box-label">{label}</span>
      {currency && <span className="stat-box-currency">{currency}</span>}
      <span className="stat-box-value">{value}</span>
    </div>
  );
}
