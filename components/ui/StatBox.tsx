// components/ui/StatBox.tsx
// Read-only "ability score" style stat block for the character-sheet item views.
export function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat-box">
      <span className="stat-box-label">{label}</span>
      <span className="stat-box-value">{value}</span>
    </div>
  );
}
